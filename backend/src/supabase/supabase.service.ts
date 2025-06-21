import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabaseClient = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_KEY') || '',
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }

  get client() {
    return this.supabaseClient;
  }

  // Методы для работы с пользователями
  async getUserProfile(userId: string) {
    return await this.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
  }

  async updateUserProfile(userId: string, data: any) {
    return await this.supabaseClient
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();
  }

  // Методы для работы с аутентификацией
  async getUserByEmail(email: string) {
    // Используем поиск пользователей с фильтрацией на стороне клиента
    const { data, error } = await this.supabaseClient.auth.admin.listUsers();
    
    if (error) throw error;
    
    // Фильтруем пользователей по email на стороне клиента
    const filteredUsers = data.users.filter(user => user.email === email);
    return filteredUsers.length > 0 ? filteredUsers[0] : null;
  }

  async createUser(email: string, password: string, userData: any = {}) {
    return await this.supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userData,
    });
  }

  async deleteUser(userId: string) {
    return await this.supabaseClient.auth.admin.deleteUser(userId);
  }

  // Дополнительные методы могут быть добавлены по мере необходимости
} 