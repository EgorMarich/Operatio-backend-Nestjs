import { AuthModule } from './../../auth/auth.module';
import { UserRole } from './../entities/user.entity';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  avatar: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  password: string;

  @IsBoolean()
  isVerified?: boolean

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsInt()
  @Min(0)
  @IsOptional()
  authMethod?: number;

  @IsDateString()
  birthDate?: string;
}
