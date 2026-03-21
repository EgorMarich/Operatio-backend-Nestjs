import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { Message } from './message.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('message_reactions')
@Unique(['messageId', 'userId', 'emoji']) 
export class MessageReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  emoji: string;

  @ManyToOne(() => Message, m => m.reactions, { onDelete: 'CASCADE' })
  message: Message;

  @Column()
  messageId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;
}