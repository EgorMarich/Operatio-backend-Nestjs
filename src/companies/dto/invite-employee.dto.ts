import { IsEmail, IsEnum, IsOptional, IsInt } from 'class-validator';
import { UserRole } from 'src/users/entities/user.entity';

export class InviteEmployeeDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsInt()
  departmentId?: number;
}