import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { FileAttachment } from './entities/file-attachemnt.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Comment, FileAttachment])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
