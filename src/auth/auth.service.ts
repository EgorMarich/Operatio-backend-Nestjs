import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepositary: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private userService: UsersService,
    private dataSource: DataSource,
  ) {}

  registerOwner = async ({ email, password, name, companyData }: any) => {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const existingUser = await queryRunner.manager.findOne(User, {
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'Пользователь с таким email уже зарегистрирован'
      });
    }

    if (companyData.slug) {
      const existingCompany = await queryRunner.manager.findOne(Company, {
        where: { slug: companyData.slug }
      });

      if (existingCompany) {
        throw new ConflictException('Компания с таким slug уже существует');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10); 

    const company = queryRunner.manager.create(Company, {
      ...companyData,
      isActive: true
    });
    const savedCompany = await queryRunner.manager.save(Company, company);

    const user = queryRunner.manager.create(User, {
      email,
      password: hashedPassword,
      name,
      role: UserRole.OWNER,
      isActive: true,
      company: savedCompany
    });

    const savedUser = await queryRunner.manager.save(User, user);

    await queryRunner.commitTransaction();

    return {
      user: savedUser,
      company: savedCompany,

    };

  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err; 
  } finally {
    await queryRunner.release();
  }
};


  async login({ email }) {
    const user = await this.userService.findByEmail(email);
    return user;
  }
}
