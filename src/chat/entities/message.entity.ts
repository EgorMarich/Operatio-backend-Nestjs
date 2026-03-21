import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, CreateDateColumn
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from 'src/users/entities/user.entity';
import { MessageReaction } from './message-reaction.entity';


export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  SYSTEM = 'system', 
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  // Файл
  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  fileMime: string;

  // Reply
  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  replyTo: Message;

  @Column({ nullable: true })
  replyToId: number;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @ManyToOne(() => Chat, c => c.messages, { onDelete: 'CASCADE' })
  chat: Chat;

  @Column()
  chatId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  author: User;

  @Column()
  authorId: number;

  @OneToMany(() => MessageReaction, r => r.message, { cascade: true })
  reactions: MessageReaction[];

  @CreateDateColumn()
  createdAt: Date;
}