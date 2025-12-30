import { UsersModule } from './../users/users.module';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from 'src/companies/companies.module';
import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { CompanyInvitation } from 'src/companies/entities/company-invitation.entity';

@Module({
  imports: [UsersModule, CompaniesModule,  TypeOrmModule.forFeature([ User, Company, CompanyInvitation])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
