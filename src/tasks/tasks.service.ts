import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, Priority } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { FileAttachment } from './entities/file-attachemnt.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { MulterFile } from './types/multer-file.type';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FileAttachment)
    private fileRepository: Repository<FileAttachment>,
  ) {}

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: number,
    files?: MulterFile[],
  ): Promise<TaskResponseDto> {
    const creator = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!creator) {
      throw new NotFoundException('Создатель не найден');
    }

    let participants: User[] = [];
    if (createTaskDto.participantIds && createTaskDto.participantIds.length > 0) {
      participants = await this.userRepository.find({
        where: { id: In(createTaskDto.participantIds) },
      });
      
  
      const foundIds = participants.map(p => p.id);
      const notFoundIds = createTaskDto.participantIds.filter(id => !foundIds.includes(id));
      
      if (notFoundIds.length > 0) {
        throw new NotFoundException(`Участники с ID ${notFoundIds.join(', ')} не найдены`);
      }
    }

    const dateStart = createTaskDto.dateStart || new Date(); 
    const dateEnd = createTaskDto.dateEnd || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {

      const task = new Task();
      task.title = createTaskDto.title;
      task.description = createTaskDto.description || '';
      task.priority = createTaskDto.priority;
      task.dateStart = dateStart;
      task.dateEnd = dateEnd;
      task.creator = creator;
      task.creatorId = userId;
      

      const creatorInList = participants.some(p => p.id === creator.id);
        if (!creatorInList) {
          task.participants = [creator, ...participants];
        } else {
          task.participants = participants;
        }


      const savedTask = await this.taskRepository.save(task);

      if (files && files.length > 0) {
        if (files.length > 10) {
          throw new BadRequestException('Максимум 10 файлов');
        }

        await this.saveTaskFiles(savedTask, creator, files);
      }

      const completeTask = await this.taskRepository.findOne({
        where: { id: savedTask.id },
        relations: ['creator', 'participants', 'files', 'comments'],
      });

      if (!completeTask) {
        throw new InternalServerErrorException('Не удалось загрузить созданную задачу');
      }

      return this.mapToResponseDto(completeTask);
    } catch (error) {
      console.error('Error creating task:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Ошибка при создании задачи');
    }
  }

  private async saveTaskFiles(task: Task, creator: User, files: MulterFile[]): Promise<void> {
    const fileAttachments: FileAttachment[] = [];
    const uploadDir = path.join(process.cwd(), 'uploads', 'tasks', task.id.toString());

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`;
      const filePath = path.join(uploadDir, fileName);


      fs.writeFileSync(filePath, file.buffer);

      const fileAttachment = new FileAttachment();
      fileAttachment.filename = fileName;
      fileAttachment.originalName = file.originalname;
      fileAttachment.mimeType = file.mimetype;
      fileAttachment.size = file.size;
      fileAttachment.path = filePath;
      fileAttachment.task = task;
      fileAttachment.uploadedBy = creator;
      fileAttachment.uploadedById = creator.id;

      fileAttachments.push(fileAttachment);
    }

    await this.fileRepository.save(fileAttachments);
  }

  async getAllTasksByUserId(id: number): Promise<TaskResponseDto[]> {
  const tasks = await this.taskRepository.find({
    relations: ['files', 'comments', 'creator', 'participants'],
    where: { 
      participants: { 
        id: id 
      }
    }
  });

  return tasks.map(task => this.mapToResponseDto(task));
}

  async getAllTasks(): Promise<TaskResponseDto[]> {
  const tasks = await this.taskRepository.find({
    relations: ['files', 'comments', 'creator', 'participants'],
  });
  
  return tasks.map(task => this.mapToResponseDto(task));
}

  async getTaskById(id: number): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: [
      'creator',
      'participants',
      'files',
      'comments',
      'comments.author', 
    ],
    });

    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }

    return this.mapToResponseDto(task);
  }

  private mapToResponseDto(task: Task): TaskResponseDto {

  const creator = task.creator ? {
    id: task.creator.id,
    name: task.creator.name,
    email: task.creator.email,
    avatar: task.creator.avatar,
    avatarColor: task.creator.avatarColor,
  } : undefined;


  const participants = task.participants?.map(p => ({
    id: p.id,
    name: p.name,
    email: p.email,
    avatar: p.avatar,
    avatarColor: p.avatarColor,
  })) || [];


  const comments = task.comments?.map(comment => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: comment.author ? {
      id: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
      avatar: comment.author.avatar,
      avatarColor: comment.author.avatarColor,
    } : {
      id: comment.authorId,
      name: 'Пользователь удалён',
      avatarColor: '#CCCCCC',
    },
  })) || [];

  return {

    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dateStart: task.dateStart,
    dateEnd: task.dateEnd,
    createdAt: task.createdAt,
    
    creatorId: task.creatorId,
    creatorName: task.creator?.name,
    participantIds: participants.map(p => p.id),
    
    creator,
    participants,
    comments,
    
    // Файлы
    files: task.files ? task.files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      uploadedAt: file.uploadedAt,
    })) : [],
    

    commentCount: comments.length,
    fileCount: task.files?.length || 0,
  };
}
}