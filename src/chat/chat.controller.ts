import { AuthGuardCustom } from './../auth/guards/auth.guard';
// src/chat/chat.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, ParseIntPipe, UseGuards, Req, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { ChatGateway } from './chat.gateway';
import { ChatService } from './Chat.service';
import { CreateChatDto } from './entities/create-chat.dto';
import { SendMessageDto } from './entities/send-message.dto';

@Controller('chats')
@UseGuards(AuthGuardCustom)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get()
  getMyChats(@Req() req) {
    return this.chatService.getUserChats(req.user.id);
  }

  @Post()
  async createChat(@Req() req, @Body() dto: CreateChatDto) {
    const chat = await this.chatService.createChat(req.user.id, dto);
    // Подписываем всех участников на комнату
    this.chatGateway.broadcastEvent(chat.id, 'chat_created', chat);
    return chat;
  }

  @Get(':id/messages')
  getMessages(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('page', ParseIntPipe) page = 1,
  ) {
    return this.chatService.getMessages(req.user.id, id, page);
  }

  @Post(':id/messages')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = `uploads/chat/${req.params.id}`;
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
  }))
  async sendMessage(
    @Req() req,
    @Param('id', ParseIntPipe) chatId: number,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const message = await this.chatService.sendMessage(req.user.id, chatId, dto, file);
    this.chatGateway.broadcastMessage(chatId, message);
    return message;
  }

  @Patch('messages/:id')
  async editMessage(@Req() req, @Param('id', ParseIntPipe) id: number, @Body('content') content: string) {
    const message = await this.chatService.editMessage(req.user.id, id, content);
    this.chatGateway.broadcastEvent(message.chatId, 'message_edited', message);
    return message;
  }

  @Delete('messages/:id')
  async deleteMessage(@Req() req, @Param('id', ParseIntPipe) id: number) {
    await this.chatService.deleteMessage(req.user.id, id);
    this.chatGateway.broadcastEvent(id, 'message_deleted', { messageId: id });
  }

  @Post('messages/:id/reactions')
  async toggleReaction(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('emoji') emoji: string,
  ) {
    await this.chatService.toggleReaction(req.user.id, id, emoji);
    this.chatGateway.broadcastEvent(id, 'reaction_updated', { messageId: id });
  }

  @Get(':id/search')
  search(@Req() req, @Param('id', ParseIntPipe) id: number, @Query('q') q: string) {
    return this.chatService.searchMessages(req.user.id, id, q);
  }

  @Post(':id/members')
  addMember(@Req() req, @Param('id', ParseIntPipe) id: number, @Body('userId') userId: number) {
    return this.chatService.addMember(req.user.id, id, userId);
  }

  @Delete(':id/members/:userId')
  removeMember(@Req() req, @Param('id', ParseIntPipe) id: number, @Param('userId', ParseIntPipe) userId: number) {
    return this.chatService.removeMember(req.user.id, id, userId);
  }

  @Patch(':id/members/:userId/admin')
  setAdmin(@Req() req, @Param('id', ParseIntPipe) id: number, @Param('userId', ParseIntPipe) userId: number) {
    return this.chatService.setAdmin(req.user.id, id, userId);
  }

  @Patch(':id/mute')
  toggleMute(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.chatService.toggleMute(req.user.id, id);
  }

  @Patch(':id/pin')
  pinMessage(@Req() req, @Param('id', ParseIntPipe) id: number, @Body('messageId') messageId: number) {
    return this.chatService.pinMessage(req.user.id, id, messageId);
  }

  @Get('online')
  getOnlineUsers() {
    return this.chatService['chatGateway']?.getOnlineUsers() ?? [];
  }
}