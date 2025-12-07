import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Почта должна быть строкой' })
  @IsNotEmpty({ message: 'Почта обязательна' })
  @IsEmail({}, { message: 'Неккоректный формат почты' })
  email: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, {
    message: 'Пароль должен содержать в себе минимум 6 символов',
  })
  @MaxLength(30, {
    message: 'Пароль должен содержать в себе максимум 30 символов',
  })
  password: string;
}
