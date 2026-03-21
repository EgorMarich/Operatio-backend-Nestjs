import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number; 

  @IsOptional()
  @IsInt()
  headId?: number;
}