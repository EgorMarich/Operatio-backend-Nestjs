import { IsString, IsEmail, MinLength, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';


export class CompanyDataDto {
  @IsString({ message: 'Название компании должно быть строкой' })
  @MinLength(2, { message: 'Должно быть минимум два символа в названии компании' })
  name: string; 

  @IsOptional()
  @IsString({ message: 'Slug должен быть строкой' })
  slug?: string; 

  @IsEmail({}, { message: 'Неверный формат email компании' })
  email: string; 

  @IsOptional()
  @IsString({ message: 'Телефон компании должен быть строкой' })
  telephone?: string; 

  @IsOptional()
  @IsString({ message: 'Адрес компании должен быть строкой' })
  address?: string; 

  @IsOptional()
  @IsString({ message: 'Сайт компании должен быть строкой' })
  website?: string; 

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  description?: string;
}

export class RegisterOwnerDto {
  @IsEmail({}, { message: 'Неверный формат email пользователя' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  password: string;

  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Должно быть минимум две буквы в имени' })
  name: string;

  @ValidateNested()
  @Type(() => CompanyDataDto)
  dataCompany: CompanyDataDto;
}