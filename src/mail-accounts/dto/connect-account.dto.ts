import { IsEmail, IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class ConnectMailAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string; 

  @IsString()
  imapHost: string; 

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  imapPort?: number; 

  @IsBoolean()
  @IsOptional()
  imapSecure?: boolean; 
}