// src/departments/departments.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Department } from './entities/departments.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private deptRepo: Repository<Department>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private async assertCanManage(userId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user || ![UserRole.OWNER, UserRole.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return user;
  }

  async create(userId: number, dto: CreateDepartmentDto): Promise<Department> {
    const user = await this.assertCanManage(userId);

    const dept = this.deptRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      parentId: dto.parentId ?? null,
      headId: dto.headId ?? null,
      companyId: user.companyId,
    } as DeepPartial<Department>);

    return this.deptRepo.save(dept);
  }

  async getTree(companyId: number): Promise<Department[]> {
    const all = await this.deptRepo.find({
      where: { companyId },
      relations: ['children', 'head', 'members'],
      order: { createdAt: 'ASC' },
    });

    // Возвращаем только корневые — children уже подтянуты через relation
    return all.filter(d => !d.parentId);
  }

  async update(userId: number, deptId: number, dto: Partial<CreateDepartmentDto>): Promise<Department> {
    await this.assertCanManage(userId);

    const dept = await this.deptRepo.findOneBy({ id: deptId });
    if (!dept) throw new NotFoundException('Отдел не найден');

    Object.assign(dept, dto);
    return this.deptRepo.save(dept);
  }

  async remove(userId: number, deptId: number): Promise<void> {
    await this.assertCanManage(userId);
    await this.deptRepo.delete(deptId);
  }

  async assignMember(userId: number, deptId: number, memberId: number): Promise<void> {
    await this.assertCanManage(userId);

    const member = await this.userRepo.findOneBy({ id: memberId });
    if (!member) throw new NotFoundException('Сотрудник не найден');

    member.departmentId = deptId;
    await this.userRepo.save(member);
  }

  async removeMember(userId: number, memberId: number): Promise<void> {
    await this.assertCanManage(userId);

    const member = await this.userRepo.findOneBy({ id: memberId });
    if (!member) throw new NotFoundException('Сотрудник не найден');

    member.departmentId = null;
    await this.userRepo.save(member);
  }
}