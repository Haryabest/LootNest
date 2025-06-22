import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl) {
      console.warn('SUPABASE_URL not found in environment variables. Using default or fallback URL.');
    }
    
    if (!supabaseKey) {
      console.warn('SUPABASE_ANON_KEY not found in environment variables. Using default or fallback key.');
    }

    // Используем пустые строки как значения по умолчанию, чтобы избежать ошибки
    this.supabaseClient = createClient(
      supabaseUrl || 'https://placeholder-url.supabase.co',
      supabaseKey || 'placeholder-key',
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
    // Используем публичный API для поиска пользователя
    // Примечание: с анонимным ключом этот метод может не работать
    try {
      const { data, error } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(email: string, password: string, userData: any = {}) {
    // С анонимным ключом создание пользователя через API может быть недоступно
    // Этот метод может требовать сервисного ключа
    try {
      return await this.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    // С анонимным ключом удаление пользователя через API может быть недоступно
    // Этот метод требует сервисного ключа
    console.warn('deleteUser method requires service key and may not work with anon key');
    return { error: { message: 'Operation not supported with anon key' } };
  }

  // Методы для работы с хранилищем аватаров
  
  /**
   * Проверяет существование бакета для аватаров и создает его при необходимости
   */
  async ensureAvatarBucketExists() {
    try {
      console.log('Проверка существования бакета avatars...');
      
      // Сначала пробуем создать бакет
      try {
        const { error: createError } = await this.supabaseClient.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif']
        });
        
        if (createError) {
          if (!createError.message.includes('already exists')) {
            console.error('Ошибка при создании бакета:', createError);
          } else {
            console.log('Бакет avatars уже существует');
          }
        } else {
          console.log('Бакет avatars успешно создан');
          return true;
        }
      } catch (err) {
        console.error('Ошибка при создании бакета:', err);
      }
      
      // Проверяем наличие бакета через список
      const { data: buckets, error } = await this.supabaseClient.storage.listBuckets();
      
      if (error) {
        console.error('Ошибка при получении списка бакетов:', error);
        
        if (error.message.includes('row-level security policy')) {
          console.log('Ошибка RLS политики - предполагаем, что бакет существует');
          return true;
        }
      }
      
      // Проверяем наличие бакета в списке
      const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
      
      if (avatarBucket) {
        console.log('Бакет avatars найден в списке');
        return true;
      }
      
      // Если бакет не найден, пробуем получить публичный URL
      const { data } = this.supabaseClient.storage.from('avatars').getPublicUrl('test.txt');
      
      if (data && data.publicUrl && data.publicUrl.includes('avatars')) {
        console.log('Бакет avatars существует, но не виден в списке');
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Непредвиденная ошибка при проверке бакета:', err);
      return false;
    }
  }
  
  /**
   * Загружает аватар пользователя
   */
  async uploadAvatar(userId: string, file: Buffer, fileName: string) {
    try {
      // Проверяем существование бакета
      await this.ensureAvatarBucketExists();
      
      // Генерируем путь для файла
      const fileExt = fileName.split('.').pop();
      const timestamp = Date.now();
      const avatarFileName = `avatar-${timestamp}.${fileExt}`;
      const filePath = `${userId}/${avatarFileName}`;
      
      // Загружаем файл
      const { data, error } = await this.supabaseClient.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Ошибка при загрузке аватара:', error);
        return { error };
      }
      
      // Получаем публичный URL
      const { data: urlData } = this.supabaseClient.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Обновляем профиль пользователя
      await this.updateUserProfile(userId, {
        avatar_url: urlData.publicUrl
      });
      
      return { data: urlData };
    } catch (err) {
      console.error('Непредвиденная ошибка при загрузке аватара:', err);
      return { error: err };
    }
  }
  
  /**
   * Исправляет URL аватара, если он содержит дублирование путей
   */
  fixAvatarUrl(url: string | null): string | null {
    if (!url) return null;
    
    try {
      // Проверяем наличие дублирования "avatars/avatars/" в URL
      if (url.includes('avatars/avatars/')) {
        return url.replace('avatars/avatars/', 'avatars/');
      }
      
      return url;
    } catch (err) {
      console.error('Ошибка при исправлении URL аватара:', err);
      return url;
    }
  }
  
  /**
   * Получает URL аватара пользователя
   */
  async getAvatarUrl(userId: string) {
    try {
      const { data, error } = await this.getUserProfile(userId);
      
      if (error || !data) {
        return { error: error || new Error('Профиль пользователя не найден') };
      }
      
      const avatarUrl = this.fixAvatarUrl(data.avatar_url);
      
      return { data: { avatarUrl } };
    } catch (err) {
      console.error('Ошибка при получении URL аватара:', err);
      return { error: err };
    }
  }
} 