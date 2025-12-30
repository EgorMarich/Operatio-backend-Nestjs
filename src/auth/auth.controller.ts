import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterOwnerDto } from './dto/register-company.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { type Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/me')
  @HttpCode(200)
  getMe(@Req() req: Request){
    return this.authService.getMe(req)
  }


  @Post('/login')
  @HttpCode(200)
  login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.login(body, req);
  }


  @Post('/register-company')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async registerOwner(
    @Body() registerOwnerDto: RegisterOwnerDto
  ): Promise<RegisterResponseDto> {
    return this.authService.registerOwner(registerOwnerDto);
  }
}
