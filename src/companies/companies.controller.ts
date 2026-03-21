// src/companies/companies.controller.ts
import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { AcceptInviteDto } from 'src/auth/dto/accept-invite.dto';
import { UserRole } from 'src/users/entities/user.entity';
import { AuthGuardCustom } from 'src/auth/guards/auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('invitations/:token')
  getInvitation(@Param('token') token: string) {
    return this.companiesService.getInvitationByToken(token);
  }

  @Post('invitations/accept')
  acceptInvitation(@Body() dto: AcceptInviteDto) {
    return this.companiesService.acceptInvitation(dto);
  }

  @UseGuards(AuthGuardCustom)
  @Post('invitations')
  createInvitation(@Req() req, @Body() dto: InviteEmployeeDto) {
    return this.companiesService.createInvitation(req.user.id, dto);
  }

  @UseGuards(AuthGuardCustom)
  @Get('invitations')
  getInvitations(@Req() req) {
    return this.companiesService.getInvitations(req.user.id);
  }

  @UseGuards(AuthGuardCustom)
  @Delete('invitations/:id')
  cancelInvitation(@Req() req, @Param('id') id: string) {
    return this.companiesService.cancelInvitation(req.user.id, id);
  }

  @UseGuards(AuthGuardCustom)
  @Get('employees')
  getEmployees(@Req() req) {
    return this.companiesService.getEmployees(req.user.id);
  }

  @UseGuards(AuthGuardCustom)
  @Patch('employees/:id/role')
  updateRole(@Req() req, @Param('id') id: string, @Body('role') role: UserRole) {
    return this.companiesService.updateEmployeeRole(req.user.id, +id, role);
  }

  @UseGuards(AuthGuardCustom)
  @Delete('employees/:id')
  removeEmployee(@Req() req, @Param('id') id: string) {
    return this.companiesService.removeEmployee(req.user.id, +id);
  }
}