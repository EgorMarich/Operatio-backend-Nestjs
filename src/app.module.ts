import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import { CompaniesModule } from './companies/companies.module';
import { EventsModule } from './events/events.module';
import { CommentsModule } from './tasks/comments/comments.module';
import { MailAccountsModule } from './mail-accounts/mail-accounts.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    MailAccountsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'student',
      password: 'student',
      database: 'operatio',
      synchronize: true,
      autoLoadEntities: true,
    }),
    CompaniesModule,
    TasksModule, 
    EventsModule,
    CommentsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
