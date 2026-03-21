import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { MailAccount } from './mail-account.entity';

@Entity('mail_messages')
export class MailMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uid: string; // уникальный ID письма на IMAP сервере

  @Column()
  subject: string;

  @Column({ nullable: true })
  fromName: string;

  @Column()
  fromEmail: string;

  @Column({ type: 'text', nullable: true })
  textBody: string;

  @Column({ type: 'text', nullable: true })
  htmlBody: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  sentAt: Date;

  @CreateDateColumn()
  receivedAt: Date;

  @ManyToOne(() => MailAccount, account => account.messages, { onDelete: 'CASCADE' })
  account: MailAccount;

  @Column()
  accountId: number;
}