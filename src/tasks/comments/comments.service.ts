import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async create(taskId: number, authorId: number, dto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentRepository.create({
      content: dto.content,
      task: { id: taskId },
      author: { id: authorId },
      authorId,
    });

    return this.commentRepository.save(comment);
  }

  async findAllByTask(taskId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { task: { id: taskId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(commentId: number, userId: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${commentId} not found`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async remove(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment #${commentId} not found`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.remove(comment);
  }
}