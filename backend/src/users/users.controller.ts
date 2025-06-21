import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: string) {
    try {
      return await this.usersService.getUserProfile(userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/profile')
  async updateUserProfile(
    @Param('id') userId: string,
    @Body() userData: any,
  ) {
    try {
      return await this.usersService.updateUserProfile(userId, userData);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('register')
  async registerUser(
    @Body() userData: { email: string; password: string; username: string },
  ) {
    try {
      const { email, password, username } = userData;
      const user = await this.usersService.createUser(email, password, { username });
      return user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id') userId: string) {
    try {
      return await this.usersService.deleteUser(userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 