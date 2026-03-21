import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator'; 

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(), 
    );

    //Проверяем требует ли наш запрос каких-либо ролей

    if (!requiredRoles) {
      return true;
    }

    //Если не требует, тогда сразу возвращаем true, так как вход для всех

    
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    //Если роли все таки требуются, то получает user`а

   
    return requiredRoles.some((role) => user.roles?.includes(role));

    //Проверяем есть ли у user`a хоть какая-то роль из перечисленных
  }
}