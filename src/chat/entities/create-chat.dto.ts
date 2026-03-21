import { IsString, IsEnum, IsArray, IsInt, IsOptional, MinLength } from 'class-validator';
import { ChatType } from '../entities/chat.entity';

export class CreateChatDto {
  @IsEnum(ChatType)
  type: ChatType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string; 

  @IsArray()
  @IsInt({ each: true })
  memberIds: number[]; 
}