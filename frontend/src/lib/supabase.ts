import { createClient } from '@supabase/supabase-js';

// Получаем URL и ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Сохраняем сессию в localStorage
    autoRefreshToken: true, // Автоматически обновляем токен
  }
});

// Функция для входа через социальные сети
export async function signInWithProvider(provider: 'google' | 'github') {
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// Функция для получения текущей сессии
export async function getSession() {
  return await supabase.auth.getSession();
}

// Функция для получения профиля пользователя
export async function getUserProfile(userId: string) {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
}

// Функция для обновления профиля пользователя
export async function updateUserProfile(userId: string, data: any) {
  return await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single();
}

// Функция для выхода из аккаунта
export async function signOut() {
  return await supabase.auth.signOut();
} 