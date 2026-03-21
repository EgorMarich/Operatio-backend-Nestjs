import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailAccount } from './entities/mail-account.entity';
import { MailMessage } from './entities/mail-message.entity';
import { ConnectMailAccountDto } from './dto/connect-account.dto';
import { ImapService } from './imap.service';
import { MailGateway } from './mail.gateway';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.MAIL_ENCRYPTION_KEY!; // 32 байта hex
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

@Injectable()
export class MailAccountsService {
  constructor(
    @InjectRepository(MailAccount)
    private accountRepo: Repository<MailAccount>,
    @InjectRepository(MailMessage)
    private messageRepo: Repository<MailMessage>,
    private imapService: ImapService,
    private mailGateway: MailGateway,
  ) {}

  async connectAccount(userId: number, dto: ConnectMailAccountDto): Promise<MailAccount> {
    const ok = await this.imapService.testConnection(
      dto.email, dto.password,
      dto.imapHost, dto.imapPort ?? 993, dto.imapSecure ?? true,
    );

    if (!ok) throw new BadRequestException('Не удалось подключиться. Проверь данные и app-password.');

    const account = this.accountRepo.create({
      email: dto.email,
      imapHost: dto.imapHost,
      imapPort: dto.imapPort ?? 993,
      imapSecure: dto.imapSecure ?? true,
      encryptedPassword: encrypt(dto.password),
      userId,
    });

    const saved = await this.accountRepo.save(account);

    // Первичная синхронизация — не ждём, запускаем в фоне
    this.syncAccount(saved).catch(() => {});

    return saved;
  }

  async getAccounts(userId: number): Promise<MailAccount[]> {
    return this.accountRepo.find({ where: { userId } });
  }

  async deleteAccount(userId: number, accountId: number): Promise<void> {
    const account = await this.accountRepo.findOne({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundException('Аккаунт не найден');
    await this.accountRepo.remove(account);
  }

  async getMessages(userId: number, accountId: number, page = 1, limit = 30) {
    const account = await this.accountRepo.findOne({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundException('Аккаунт не найден');

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { accountId },
      order: { sentAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { messages, total, page, limit };
  }

  async getMessage(userId: number, messageId: number): Promise<MailMessage> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['account'],
    });
    if (!message || message.account.userId !== userId) throw new NotFoundException();

    // Помечаем как прочитанное
    if (!message.isRead) {
      message.isRead = true;
      await this.messageRepo.save(message);
    }

    return message;
  }

  async replyToMessage(userId: number, messageId: number, text: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['account'],
    });
    if (!message || message.account.userId !== userId) throw new NotFoundException();

    const account = message.account;
    const password = decrypt(account.encryptedPassword);

    // Для SMTP используем тот же хост но другой порт
    const smtpHost = account.imapHost.replace('imap.', 'smtp.');
    
    await this.imapService.sendReply(
      account.email, password,
      smtpHost, 587,
      message.fromEmail,
      message.subject,
      text,
    );
  }

  async markAsRead(userId: number, messageId: number): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['account'],
    });
    if (!message || message.account.userId !== userId) throw new NotFoundException();
    message.isRead = true;
    await this.messageRepo.save(message);
  }

  // Вызывается планировщиком каждые 2 минуты
  async syncAccount(account: MailAccount): Promise<number> {
    const password = decrypt(account.encryptedPassword);
    const since = account.lastSyncAt ?? undefined;

    const fetched = await this.imapService.fetchMessages(account, password, since);

    // Фильтруем уже сохранённые письма
    const existingUids = await this.messageRepo
      .createQueryBuilder('m')
      .select('m.uid')
      .where('m.accountId = :id', { id: account.id })
      .getMany()
      .then(rows => new Set(rows.map(r => r.uid)));

    const newMessages = fetched.filter(m => !existingUids.has(m.uid));

    if (newMessages.length > 0) {
      const entities = newMessages.map(m =>
        this.messageRepo.create({ ...m, accountId: account.id }),
      );
      await this.messageRepo.save(entities);

      // WebSocket уведомление
      this.mailGateway.notifyNewMessages(account.userId, newMessages.length);
    }

    account.lastSyncAt = new Date();
    await this.accountRepo.save(account);

    return newMessages.length;
  }
}