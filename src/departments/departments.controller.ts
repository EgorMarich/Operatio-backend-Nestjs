// src/departments/departments.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AuthGuardCustom } from 'src/auth/guards/auth.guard';

@Controller('departments')
@UseGuards(AuthGuardCustom)
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateDepartmentDto) {
    return this.deptService.create(req.user.id, dto);
  }

  @Get()
  getTree(@Req() req) {
    return this.deptService.getTree(req.user.companyId);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: Partial<CreateDepartmentDto>) {
    return this.deptService.update(req.user.id, +id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.deptService.remove(req.user.id, +id);
  }

  @Patch(':id/members/:memberId')
  assignMember(@Req() req, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.deptService.assignMember(req.user.id, +id, +memberId);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Req() req, @Param('memberId') memberId: string) {
    return this.deptService.removeMember(req.user.id, +memberId);
  }
}