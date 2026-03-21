import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';


@Injectable() 
export class AuthGuardCustom implements CanActivate {
  constructor(private usersService: UsersService) {} 

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as any;
    
    if (!request.session?.userId) {
      throw new UnauthorizedException('Вы не авторизованы');
    }
    
    const user = await this.usersService.findById(request.session.userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    
    request.user = user;
    return true;
  }
}