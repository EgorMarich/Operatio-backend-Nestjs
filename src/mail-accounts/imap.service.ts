import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { MailAccount } from './entities/mail-account.entity';

export interface FetchedMessage {
  uid: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  textBody: string;
  htmlBody: string;
  sentAt: Date;
}

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  async testConnection(
    email: string,
    password: string,
    host: string,
    port: number,
    secure: boolean,
  ): Promise<boolean> {
    const client = new ImapFlow({
      host,
      port,
      secure,
      auth: { user: email, pass: password },
      logger: false,
    });

    try {
      await client.connect();
      await client.logout();
      return true;
    } catch {
      return false;
    }
  }

  async fetchMessages(account: MailAccount, password: string, since?: Date): Promise<FetchedMessage[]> {
    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      auth: { user: account.email, pass: password },
      logger: false,
    });

    const messages: FetchedMessage[] = [];

    try {
      await client.connect();
      await client.mailboxOpen('INBOX');

      const searchDate = since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for await (const msg of client.fetch(
        { since: searchDate },
        { uid: true, envelope: true, source: true },
      )) {
        try {
          const parsed: ParsedMail = await simpleParser(msg.source);

          messages.push({
            uid: String(msg.uid),
            subject: parsed.subject ?? '(без темы)',
            fromName: parsed.from?.value[0]?.name ?? '',
            fromEmail: parsed.from?.value[0]?.address ?? '',
            textBody: parsed.text ?? '',
            htmlBody: parsed.html || '',
            sentAt: parsed.date ?? new Date(),
          });
        } catch (parseErr) {
          this.logger.warn(`Не удалось разобрать письмо uid=${msg.uid}`);
        }
      }

      await client.logout();
    } catch (err) {
      this.logger.error(`IMAP ошибка для ${account.email}: ${err.message}`);
      throw err;
    }

    return messages;
  }

  async sendReply(
    fromEmail: string,
    password: string,
    smtpHost: string,
    smtpPort: number,
    toEmail: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: fromEmail, pass: password },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      text,
    });
  }
}