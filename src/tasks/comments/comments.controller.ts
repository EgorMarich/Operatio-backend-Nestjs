import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {type Request } from 'express';

@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const userId = req?.session.userId;
    return this.commentsService.create(taskId, Number(userId), dto);
  }

  @Get()
  findAll(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.commentsService.findAllByTask(taskId);
  }


  @Patch(':commentId')
  update(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, userId, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: Request,
  ) {
    const userId = req?.session.userId;
    return this.commentsService.remove(commentId, Number(userId));
  }
}