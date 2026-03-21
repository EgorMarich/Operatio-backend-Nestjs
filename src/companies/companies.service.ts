// src/companies/companies.service.ts
import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CompanyInvitation } from './entities/company-invitation.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { AcceptInviteDto } from 'src/auth/dto/accept-invite.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(CompanyInvitation)
    private invitationRepo: Repository<CompanyInvitation>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private async assertCanInvite(userId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || ![UserRole.OWNER, UserRole.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Только owner и admin могут приглашать сотрудников');
    }
    return user;
  }

  // Создать инвайт — возвращает ссылку
  async createInvitation(inviterId: number, dto: InviteEmployeeDto): Promise<{ link: string; token: string }> {
    const inviter = await this.assertCanInvite(inviterId);

    // owner не может приглашать других owner
    if (dto.role === UserRole.OWNER && inviter.role !== UserRole.OWNER) {
      throw new ForbiddenException('Только owner может назначать роль owner');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней

    const invitation = this.invitationRepo.create({
      email: dto.email,
      token,
      role: dto.role,
      expiresAt,
      inviterId,
      companyId: inviter.companyId,
      status: 'pending',
    });

    await this.invitationRepo.save(invitation);

    const link = `${process.env.FRONTEND_URL}/invite/${token}`;
    return { link, token };
  }

  // Получить инфо об инвайте по токену (для страницы регистрации)
  async getInvitationByToken(token: string): Promise<CompanyInvitation> {
    const invitation = await this.invitationRepo.findOne({
      where: { token },
      relations: ['company', 'inviter'],
    });

    if (!invitation) throw new NotFoundException('Приглашение не найдено');
    if (invitation.status !== 'pending') throw new BadRequestException('Приглашение уже использовано');
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await this.invitationRepo.save(invitation);
      throw new BadRequestException('Срок приглашения истёк');
    }

    return invitation;
  }

  // Принять инвайт — регистрация сотрудника
  async acceptInvitation(dto: AcceptInviteDto): Promise<User> {
    const invitation = await this.getInvitationByToken(dto.token);

    // Проверяем нет ли уже такого пользователя
    const existing = await this.userRepo.findOneBy({ email: invitation.email });
    if (existing) throw new BadRequestException('Пользователь с таким email уже существует');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role as UserRole,
      companyId: invitation.companyId,
      avatarColor: this.randomColor(),
    });

    const savedUser = await this.userRepo.save(user);

    // Помечаем инвайт как принятый
    invitation.status = 'accepted';
    invitation.acceptedById = savedUser.id;
    invitation.acceptedAt = new Date();
    await this.invitationRepo.save(invitation);

    return savedUser;
  }

  // Список сотрудников компании
  async getEmployees(userId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException();

    return this.userRepo.find({
      where: { companyId: user.companyId },
      relations: ['department'],
      select: ['id', 'name', 'email', 'role', 'avatar', 'avatarColor', 'departmentId', 'createdAt'],
    });
  }

  // Список активных инвайтов
  async getInvitations(userId: number) {
    const user = await this.assertCanInvite(userId);
    return this.invitationRepo.find({
      where: { companyId: user.companyId, status: 'pending' },
      relations: ['inviter'],
      order: { createdAt: 'DESC' },
    });
  }

  // Отменить инвайт
  async cancelInvitation(userId: number, invitationId: string) {
    await this.assertCanInvite(userId);
    const invitation = await this.invitationRepo.findOneBy({ id: invitationId });
    if (!invitation) throw new NotFoundException();
    invitation.status = 'cancelled';
    return this.invitationRepo.save(invitation);
  }

  // Изменить роль сотрудника
  async updateEmployeeRole(userId: number, employeeId: number, role: UserRole) {
    const user = await this.assertCanInvite(userId);
    if (role === UserRole.OWNER && user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Только owner может назначать роль owner');
    }
    const employee = await this.userRepo.findOneBy({ id: employeeId, companyId: user.companyId });
    if (!employee) throw new NotFoundException('Сотрудник не найден');
    employee.role = role;
    return this.userRepo.save(employee);
  }

  async removeEmployee(userId: number, employeeId: number) {
  const user = await this.assertCanInvite(userId);
  if (userId === employeeId) throw new BadRequestException('Нельзя удалить себя');

  const employee = await this.userRepo.findOneBy({ id: employeeId, companyId: user.companyId ?? undefined});
  if (!employee) throw new NotFoundException('Сотрудник не найден');

  // employee.companyId = ;
  employee.departmentId = null;
  await this.userRepo.save(employee);
}

  private randomColor() {
    const colors = ['#5B8FF9', '#61DDAA', '#F6903D', '#F08BB4', '#7262FD', '#78D3F8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}