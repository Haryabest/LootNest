import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabaseService.getUserProfile(userId);
    
    if (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
    
    return data;
  }

  async updateUserProfile(userId: string, userData: any) {
    const { data, error } = await this.supabaseService.updateUserProfile(userId, userData);
    
    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
    
    return data;
  }

  async getUserByEmail(email: string) {
    try {
      return await this.supabaseService.getUserByEmail(email);
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }

  async createUser(email: string, password: string, userData: any = {}) {
    const { data, error } = await this.supabaseService.createUser(email, password, userData);
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return data;
  }

  async deleteUser(userId: string) {
    const result = await this.supabaseService.deleteUser(userId);
    
    if (result.error) {
      throw new Error(`Failed to delete user: ${result.error.message}`);
    }
    
    // Возвращаем успешный результат, так как с анонимным ключом метод не возвращает данные
    return { success: true, message: 'User deletion requested' };
  }

  /**
   * Загружает аватар пользователя
   */
  async uploadAvatar(userId: string, file: Buffer, fileName: string) {
    const { data, error } = await this.supabaseService.uploadAvatar(userId, file, fileName);
    
    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Получает URL аватара пользователя
   */
  async getAvatarUrl(userId: string) {
    const { data, error } = await this.supabaseService.getAvatarUrl(userId);
    
    if (error) {
      throw new Error(`Failed to get avatar URL: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Проверяет существование бакета для аватаров
   */
  async ensureAvatarBucketExists() {
    const result = await this.supabaseService.ensureAvatarBucketExists();
    
    if (!result) {
      throw new Error('Failed to ensure avatar bucket exists');
    }
    
    return { success: true, message: 'Avatar bucket exists or was created' };
  }
} 