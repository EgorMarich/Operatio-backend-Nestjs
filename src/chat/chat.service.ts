// src/chat/chat.service.ts
import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Chat, ChatType } from './entities/chat.entity';
import { ChatMember, MemberRole } from './entities/chat-member.entity';
import { Message, MessageType } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { User } from 'src/users/entities/user.entity';
import { SendMessageDto } from './entities/send-message.dto';
import { CreateChatDto } from './entities/create-chat.dto';


@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    @InjectRepository(ChatMember) private memberRepo: Repository<ChatMember>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(MessageReaction) private reactionRepo: Repository<MessageReaction>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  // Список чатов пользователя с последним сообщением и счётчиком непрочитанных
  async getUserChats(userId: number) {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: ['chat', 'chat.members', 'chat.members.user'],
    });

    const result = await Promise.all(memberships.map(async (m) => {
      const lastMessage = await this.messageRepo.findOne({
        where: { chatId: m.chatId },
        order: { createdAt: 'DESC' },
        relations: ['author'],
      });

      const unreadCount = m.lastReadAt
        ? await this.messageRepo.count({
            where: {
              chatId: m.chatId,
            },
          })
        : 0;

      return {
        ...m.chat,
        isMuted: m.isMuted,
        myRole: m.role,
        lastMessage,
        unreadCount,
      };
    }));

    return result.sort((a, b) =>
      (b.lastMessage?.createdAt?.getTime() ?? 0) - (a.lastMessage?.createdAt?.getTime() ?? 0)
    );
  }

  async createChat(userId: number, dto: CreateChatDto): Promise<Chat> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException();

    if (dto.type === ChatType.DIRECT) {
      if (dto.memberIds.length !== 1) throw new BadRequestException('В личном чате должен быть ровно 1 собеседник');

      const existing = await this.findDirectChat(userId, dto.memberIds[0]);
      if (existing) return existing;
    }

    if (dto.type === ChatType.GROUP && !dto.name) {
      throw new BadRequestException('Название обязательно для группового чата');
    }

    const chat = this.chatRepo.create({
      type: dto.type,
      name: dto.name,
      companyId: user.companyId,
    });
    const savedChat = await this.chatRepo.save(chat);

    // Создатель — admin
    const allMemberIds = [userId, ...dto.memberIds];
    const members = allMemberIds.map(id =>
      this.memberRepo.create({
        chatId: savedChat.id,
        userId: id,
        role: id === userId ? MemberRole.ADMIN : MemberRole.MEMBER,
      })
    );
    await this.memberRepo.save(members);

    await this.createSystemMessage(savedChat.id, userId, `создал чат`);

    return this.getChatById(userId, savedChat.id);
  }

    async getChatById(userId: number, chatId: number): Promise<Chat> {
    await this.assertMember(userId, chatId);
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
      relations: ['members', 'members.user'],
    });
    if (!chat) throw new NotFoundException('Чат не найден');
    return chat;
  }

  async getMessages(userId: number, chatId: number, page = 1, limit = 50) {
    await this.assertMember(userId, chatId);

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { chatId },
      relations: ['author', 'replyTo', 'replyTo.author', 'reactions', 'reactions.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    await this.memberRepo.update({ userId, chatId }, { lastReadAt: new Date() });

    return { messages: messages.reverse(), total, page };
  }

  async sendMessage(
  userId: number, chatId: number,
  dto: SendMessageDto,
  file?: Express.Multer.File,
): Promise<Message> {
  await this.assertMember(userId, chatId);

  const message = this.messageRepo.create({
    chatId,
    authorId: userId,
    content: dto.content,
    replyToId: dto.replyToId,
    type: file ? MessageType.FILE : (dto.type ?? MessageType.TEXT),
    ...(file && {
      fileName: file.originalname,
      filePath: `uploads/chat/${chatId}/${file.filename}`,
      fileSize: file.size,
      fileMime: file.mimetype,
    }),
  });

  const saved = await this.messageRepo.save(message);
  
  const full = await this.messageRepo.findOne({
    where: { id: saved.id },
    relations: ['author', 'replyTo', 'replyTo.author', 'reactions'],
  });
  if (!full) throw new NotFoundException('Сообщение не найдено');
  return full;
}

  async editMessage(userId: number, messageId: number, content: string): Promise<Message> {
    const message = await this.messageRepo.findOneBy({ id: messageId });
    if (!message) throw new NotFoundException();
    if (message.authorId !== userId) throw new ForbiddenException('Можно редактировать только свои сообщения');
    if (message.deletedAt) throw new BadRequestException('Нельзя редактировать удалённое сообщение');

    message.content = content;
    message.isEdited = true;
    return this.messageRepo.save(message);
  }

  async deleteMessage(userId: number, messageId: number): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['chat'],
    });
    if (!message) throw new NotFoundException();

    const member = await this.memberRepo.findOneBy({ userId, chatId: message.chatId });
    const canDelete = message.authorId === userId || member?.role === MemberRole.ADMIN;
    if (!canDelete) throw new ForbiddenException();

  
    message.deletedAt = new Date();
    message.content = null;
    await this.messageRepo.save(message);
  }

  async toggleReaction(userId: number, messageId: number, emoji: string): Promise<void> {
    const existing = await this.reactionRepo.findOneBy({ messageId, userId, emoji });
    if (existing) {
      await this.reactionRepo.remove(existing);
    } else {
      await this.reactionRepo.save(this.reactionRepo.create({ messageId, userId, emoji }));
    }
  }

  async searchMessages(userId: number, chatId: number, query: string) {
    await this.assertMember(userId, chatId);
    return this.messageRepo.find({
      where: { chatId, content: ILike(`%${query}%`) },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async addMember(actorId: number, chatId: number, newUserId: number): Promise<void> {
    await this.assertAdmin(actorId, chatId);

    const existing = await this.memberRepo.findOneBy({ chatId, userId: newUserId });
    if (existing) throw new BadRequestException('Пользователь уже в чате');

    await this.memberRepo.save(this.memberRepo.create({ chatId, userId: newUserId }));
    await this.createSystemMessage(chatId, newUserId, 'добавлен в чат');
  }

  async removeMember(actorId: number, chatId: number, targetUserId: number): Promise<void> {
    // Можно выйти самому или admin может удалить участника
    if (actorId !== targetUserId) await this.assertAdmin(actorId, chatId);

    await this.memberRepo.delete({ chatId, userId: targetUserId });
    await this.createSystemMessage(chatId, targetUserId, 'покинул чат');
  }

  async setAdmin(actorId: number, chatId: number, targetUserId: number): Promise<void> {
    await this.assertAdmin(actorId, chatId);
    await this.memberRepo.update({ chatId, userId: targetUserId }, { role: MemberRole.ADMIN });
  }

  async toggleMute(userId: number, chatId: number): Promise<{ isMuted: boolean }> {
    const member = await this.assertMember(userId, chatId);
    member.isMuted = !member.isMuted;
    await this.memberRepo.save(member);
    return { isMuted: member.isMuted };
  }

  async pinMessage(userId: number, chatId: number, messageId: number): Promise<void> {
    await this.assertAdmin(userId, chatId);
    await this.chatRepo.update(chatId, { pinnedMessageId: messageId });
  }

  // Утилиты
  private async assertMember(userId: number, chatId: number): Promise<ChatMember> {
    const member = await this.memberRepo.findOneBy({ userId, chatId });
    if (!member) throw new ForbiddenException('Ты не участник этого чата');
    return member;
  }

  private async assertAdmin(userId: number, chatId: number): Promise<void> {
    const member = await this.assertMember(userId, chatId);
    if (member.role !== MemberRole.ADMIN) throw new ForbiddenException('Нужны права администратора');
  }

  private async findDirectChat(userA: number, userB: number): Promise<Chat | null> {
    const chats = await this.chatRepo
      .createQueryBuilder('chat')
      .innerJoin('chat.members', 'ma', 'ma.userId = :userA', { userA })
      .innerJoin('chat.members', 'mb', 'mb.userId = :userB', { userB })
      .where('chat.type = :type', { type: ChatType.DIRECT })
      .getOne();
    return chats ?? null;
  }

  private async createSystemMessage(chatId: number, userId: number, text: string): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: userId });
    await this.messageRepo.save(this.messageRepo.create({
      chatId,
      authorId: userId,
      content: `${user?.name ?? 'Пользователь'} ${text}`,
      type: MessageType.SYSTEM,
    }));
  }
}