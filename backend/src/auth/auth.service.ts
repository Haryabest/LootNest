import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private usersService: UsersService,
  ) {}

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async signUp(email: string, password: string, userData: any = {}) {
    try {
      // Создаем пользователя через сервис пользователей
      return await this.usersService.createUser(email, password, userData);
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async resetPassword(email: string) {
    try {
      const { data, error } = await this.supabaseService.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/update-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  async updatePassword(accessToken: string, newPassword: string) {
    try {
      // Устанавливаем сессию с помощью токена доступа
      const { data: sessionData, error: sessionError } = await this.supabaseService.client.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // В этом случае refresh_token не требуется
      });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      // Обновляем пароль
      const { data, error } = await this.supabaseService.client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  async signOut(accessToken: string) {
    try {
      // Устанавливаем сессию с помощью токена доступа
      const { data: sessionData, error: sessionError } = await this.supabaseService.client.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // В этом случае refresh_token не требуется
      });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      // Выходим из системы
      const { error } = await this.supabaseService.client.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, message: 'Signed out successfully' };
    } catch (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }
} 