import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { MailMessage } from './mail-message.entity';

@Entity('mail_accounts')
export class MailAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  imapHost: string;

  @Column({ default: 993 })
  imapPort: number;

  @Column({ default: true })
  imapSecure: boolean;

  // Храним зашифрованно — об этом ниже
  @Column()
  encryptedPassword: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastSyncAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => MailMessage, msg => msg.account)
  messages: MailMessage[];
}