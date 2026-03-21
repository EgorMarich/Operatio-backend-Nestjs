import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MailAccount } from './entities/mail-account.entity';
import { MailMessage } from './entities/mail-message.entity';
import { MailAccountsService } from './mail-accounts.service';
import { MailAccountsController } from './mail-accounts.controller';
import { ImapService } from './imap.service';
import { MailSyncScheduler } from './mail-sync.scheduler';
import { MailGateway } from './mail.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([MailAccount, MailMessage]),
    ScheduleModule.forRoot(),
  ],
  controllers: [MailAccountsController],
  providers: [MailAccountsService, ImapService, MailSyncScheduler, MailGateway],
})
export class MailAccountsModule {}
