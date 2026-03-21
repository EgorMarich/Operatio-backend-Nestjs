
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import * as bcrypt from 'bcrypt'
import { RegisterOwnerDto } from './dto/register-company.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { identity } from 'rxjs';
import { MeResponseDto } from './dto/me-response.dto';
import { getRandomAvatarColor } from './utils/avatar.utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private userService: UsersService,
    private dataSource: DataSource,
  ) {}

  async registerOwner(registerOwnerDto: RegisterOwnerDto): Promise<RegisterResponseDto> {
  const { email, password, name, dataCompany } = registerOwnerDto;

  console.log(email)
  // if (!companyData.slug) {
  //   companyData.slug = this.generateSlug(companyData.name);
  // }

  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const existingUser = await queryRunner.manager.findOne(User, {
      where: { email }
    });

    console.log(existingUser)

    if (existingUser) {
      throw new ConflictException({
        message: 'Пользователь с таким email уже зарегистрирован'
      });
    }


    // const existingCompany = await queryRunner.manager.findOne(Company, {
    //   where: { slug: companyData.slug }
    // });

    // if (existingCompany) {
    //   throw new ConflictException('Компания с таким названием уже существует');
    // }

    const hashedPassword = await bcrypt.hash(password, 10);


    const company = queryRunner.manager.create(Company, {
      name: dataCompany.name,
      slug: dataCompany.slug || '',
      email: dataCompany.email || null,
      phone: dataCompany.telephone || null,
      website: dataCompany.website || null,
      address: dataCompany.address || null,
      isActive: true,
    } as DeepPartial<Company>);
    
    
    const savedCompany = await queryRunner.manager.save(Company, company);
    console.log('Saved company:', savedCompany); 

    const user = queryRunner.manager.create(User, {
      email,
      password: hashedPassword,
      name,
      role: UserRole.OWNER,
      isActive: true,
      company: savedCompany,
      avatarColor: getRandomAvatarColor(),
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
}


  async login(dto: LoginDto, req: Request) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new NotFoundException({ message: 'Пользователь с таким email не существует'})
    }

    const isValid = await bcrypt.compare(String(dto.password), user.password);

    if( !isValid ) {
      throw new UnauthorizedException({ message: 'Введены неверные данные'})
    }

    return this.saveSession(req, user);
  }

  async getMe( req: Request): Promise<MeResponseDto> {
    const userId = req.session.userId

    if ( !userId ) {
      throw new UnauthorizedException({ message: 'Ошибка авторизации'})
    }

    const user = await this.userRepository.findOneBy({ id: Number(userId)})

    if ( !user ) {
      req.session.destroy(() => {});
      throw new UnauthorizedException({ message: 'Такого пользоваетеля не существует'})
    }

    return {
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      isAuthenticated: true
    }
  }

  private async saveSession(req: Request, user: any) { 
        return new Promise((resolve, reject) => {
          req.session.userId = String(user.id)

          req.session.save(err => {
            if(err) {
              return reject(
                new InternalServerErrorException(
                  'Не удалось сохранить сессию. Проверьте, правильно ли настроены параметры сессии.'
                )
              )
            }

            return resolve({user})
          })
        })
      }
}
