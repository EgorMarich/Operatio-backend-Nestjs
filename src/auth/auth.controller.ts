import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post()
  @HttpCode(200)
  logout(@Body() body: LoginDto) {
    return this.authService.login(body);
  }


  @Post()
  @HttpCode(200)
  register(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
