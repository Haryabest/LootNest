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
    const { data, error } = await this.supabaseService.deleteUser(userId);
    
    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
    
    return data;
  }
} 