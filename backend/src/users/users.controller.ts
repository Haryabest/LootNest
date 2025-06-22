import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';

// Определение типа для файла Multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return await this.usersService.getUserProfile(id);
  }

  @Put(':id')
  async updateUserProfile(@Param('id') id: string, @Body() userData: any) {
    return await this.usersService.updateUserProfile(id, userData);
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    return await this.usersService.getUserByEmail(email);
  }

  @Post()
  async createUser(@Body() userData: { email: string; password: string; data?: any }) {
    const { email, password, data } = userData;
    return await this.usersService.createUser(email, password, data);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return await this.usersService.deleteUser(id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile
  ) {
    return await this.usersService.uploadAvatar(id, file.buffer, file.originalname);
  }

  @Get(':id/avatar')
  async getAvatarUrl(@Param('id') id: string) {
    return await this.usersService.getAvatarUrl(id);
  }

  @Post('storage/check-bucket')
  async checkAvatarBucket() {
    return await this.usersService.ensureAvatarBucketExists();
  }
} 