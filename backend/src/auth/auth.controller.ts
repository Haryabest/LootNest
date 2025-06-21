import { Controller, Post, Body, HttpException, HttpStatus, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: { email: string; password: string }) {
    try {
      const { email, password } = credentials;
      return await this.authService.signIn(email, password);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('register')
  async register(@Body() userData: { email: string; password: string; username: string }) {
    try {
      const { email, password, username } = userData;
      return await this.authService.signUp(email, password, { username });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() data: { email: string }) {
    try {
      return await this.authService.resetPassword(data.email);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('update-password')
  async updatePassword(
    @Headers('authorization') authHeader: string,
    @Body() data: { password: string },
  ) {
    try {
      // Извлекаем токен из заголовка Authorization
      const token = authHeader.replace('Bearer ', '');
      return await this.authService.updatePassword(token, data.password);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    try {
      // Извлекаем токен из заголовка Authorization
      const token = authHeader.replace('Bearer ', '');
      return await this.authService.signOut(token);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
} 