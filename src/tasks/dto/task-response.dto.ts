import { ApiProperty } from '@nestjs/swagger';
import { Priority, Status } from '../entities/task.entity';
import { CommentResponseDto } from '../comments/dto/comment-response.dto';
import { UserInfoDto } from 'src/users/dto/response-user.dto';

export class FileAttachmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  path: string;

  @ApiProperty()
  uploadedAt: Date;
}

export class TaskResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty({ nullable: true })
  dateStart?: Date;

  @ApiProperty({ nullable: true })
  dateEnd?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  creatorId: number;

  @ApiProperty()
  creatorName?: string;

  @ApiProperty({ type: UserInfoDto, required: false })
  creator?: UserInfoDto;

  @ApiProperty()
  personName?: string;

  @ApiProperty({ type: [Number], default: [] })
  participantIds: number[];

  @ApiProperty({ type: [UserInfoDto], default: [] })
  participants: UserInfoDto[];

  @ApiProperty({ type: [FileAttachmentResponseDto], default: [] })
  files: FileAttachmentResponseDto[];

  @ApiProperty({ default: 0 })
  commentCount: number;

  @ApiProperty({ type: [CommentResponseDto], default: [] })
  comments: CommentResponseDto[];

  @ApiProperty({ default: 0 })
  fileCount: number;
}