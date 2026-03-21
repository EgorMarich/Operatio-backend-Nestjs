import { AuthGuardCustom } from '../guards/auth.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';


export function AuthWithRoles(...roles: string[]) {
  return applyDecorators(
    Roles(...roles), 
    UseGuards(AuthGuardCustom), 
  );
}