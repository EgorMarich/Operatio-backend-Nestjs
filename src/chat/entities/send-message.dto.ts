
import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  replyToId?: number;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}