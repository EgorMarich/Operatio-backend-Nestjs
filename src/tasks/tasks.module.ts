import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { FileAttachment } from './entities/file-attachemnt.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsModule } from './comments/comments.module';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, FileAttachment, User]), UsersModule, CommentsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
