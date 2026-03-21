import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailAccount } from './entities/mail-account.entity';
import { MailAccountsService } from './mail-accounts.service';

@Injectable()
export class MailSyncScheduler {
  private readonly logger = new Logger(MailSyncScheduler.name);

  constructor(
    @InjectRepository(MailAccount)
    private accountRepo: Repository<MailAccount>,
    private mailService: MailAccountsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncAllAccounts() {
    const accounts = await this.accountRepo.find({ where: { isActive: true } });
    this.logger.log(`Синхронизация ${accounts.length} почтовых аккаунтов...`);

    await Promise.allSettled(
      accounts.map(acc => this.mailService.syncAccount(acc)),
    );
  }
}