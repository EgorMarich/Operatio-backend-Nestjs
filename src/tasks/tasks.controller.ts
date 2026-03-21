import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  Req,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { type Request } from 'express';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { AuthWithRoles } from 'src/auth/decorators/auth.decorator';
import multer from 'multer';

// import { multerConfig } from '../config/multer.config';


@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
@AuthWithRoles()
async createTask(
  @Body() createTaskDto: CreateTaskDto,
  @Req() req: Request,
): Promise<TaskResponseDto> {
  const userId = req.session.userId;
  
  const files: Express.Multer.File[] = createTaskDto.files?.map(file => ({
    fieldname: 'files',
    originalname: file.name,
    encoding: '7bit',
    mimetype: file.mimeType,
    size: file.size,
    buffer: Buffer.from(file.data, 'base64'),
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  })) || [];

  return this.tasksService.createTask(createTaskDto, Number(userId), files);
}

  @Get(':id')
  async getTask(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TaskResponseDto> {
    return this.tasksService.getTaskById(id);
  }

  // @AuthWithRoles()
  // @Get()
  // async getAllTasks(): Promise<TaskResponseDto[]> {
  //   return this.tasksService.getAllTasks();
  // }


  @AuthWithRoles()
  @Get()
    async getAllTasksByUserId(@Req() req: Request,): Promise<TaskResponseDto[]> {
      const userId = req.session.userId
      return this.tasksService.getAllTasksByUserId(Number(userId));
    }
}