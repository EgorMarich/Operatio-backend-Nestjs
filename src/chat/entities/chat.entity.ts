import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { ChatMember } from './chat-member.entity';
import { Message } from './message.entity';

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string; 

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: ChatType, default: ChatType.GROUP })
  type: ChatType;

  @Column({ nullable: true })
  pinnedMessageId: number;

  @Column()
  companyId: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ChatMember, m => m.chat, { cascade: true })
  members: ChatMember[];

  @OneToMany(() => Message, m => m.chat)
  messages: Message[];
}