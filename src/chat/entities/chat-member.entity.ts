import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from 'src/users/entities/user.entity';

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('chat_members')
export class ChatMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chat, c => c.members, { onDelete: 'CASCADE' })
  chat: Chat;

  @Column()
  chatId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @Column({ default: false })
  isMuted: boolean;

  // Для счётчика непрочитанных — одна запись вместо isRead на каждом сообщении
  @Column({ type: 'timestamp', nullable: true })
  lastReadAt: Date;

  @CreateDateColumn()
  joinedAt: Date;
}