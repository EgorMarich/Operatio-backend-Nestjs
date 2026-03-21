import { Transform, Type } from 'class-transformer';
import { 
  IsDate, 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  MaxLength, 
  IsArray, 
  ValidateNested,
  IsNumber
} from 'class-validator';
import { Priority } from '../entities/task.entity';

export class FileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  @IsNotEmpty()
  data: string; // base64
}

export class CreateTaskDto {
  @IsNotEmpty({ message: 'Заголовок обязателен' })
  @IsString()
  @MaxLength(100, { message: 'Максимум 100 символов' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'Выберите приоритет' })
  @IsEnum(Priority, { message: 'Некорректный приоритет' })
  priority: Priority;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => value ? new Date(value) : undefined)
  dateStart?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => value ? new Date(value) : undefined)
  dateEnd?: Date;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(id => Number(id));
    }
    return [Number(value)];
  })
  participantIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];
}