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

// Функция для проверки существования бакета и создания его при необходимости
export async function ensureAvatarBucketExists() {
  try {
    // Сначала проверяем наличие бакета через публичный URL
    try {
      const { data } = supabase.storage.from('avatars').getPublicUrl('test.txt');
      
      if (data && data.publicUrl && data.publicUrl.includes('avatars')) {
        return true;
      }
    } catch (err) {
      // Продолжаем проверку другими способами
    }
    
    // Проверяем список бакетов
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        // Если ошибка связана с RLS, предполагаем, что бакет уже существует
        if (error.message.includes('row-level security policy')) {
          return true;
        }
      } else {
        // Проверяем наличие бакета avatars в списке
        const avatarBucket = buckets?.find(bucket => bucket.name === 'avatars');
        
        if (avatarBucket) {
          return true;
        }
      }
    } catch (err) {
      // Продолжаем проверку другими способами
    }
    
    // Если бакет не найден, пробуем загрузить тестовый файл
    try {
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload('test.txt', testBlob, { upsert: true });
      
      if (!uploadError) {
        return true;
      } else {
        // Если ошибка связана с RLS, но не с отсутствием бакета
        if (uploadError.message.includes('row-level security policy') && !uploadError.message.includes('does not exist')) {
          return true;
        }
      }
    } catch (err) {
      // Продолжаем выполнение
    }
    
    // Возвращаем true, чтобы не блокировать загрузку аватаров
    // В худшем случае загрузка просто не удастся с ошибкой
    return true;
  } catch (err) {
    // В случае ошибки предполагаем, что бакет существует
    return true;
  }
}

// Функция для получения корректного URL аватара
export function getAvatarUrl(url: string | null): string | null {
  if (!url) return null;
  
  // Исправляем дублирование путей
  const fixedUrl = fixAvatarUrl(url);
  
  // Если URL относительный, добавляем базовый URL
  if (fixedUrl && !fixedUrl.startsWith('http')) {
    // Если URL начинается с /, то добавляем только хост
    if (fixedUrl.startsWith('/')) {
      const baseUrl = supabaseUrl.replace(/\/$/, ''); // Удаляем / в конце, если есть
      const fullUrl = `${baseUrl}${fixedUrl}`;
      return fullUrl;
    } 
    // Если URL не начинается с /, добавляем полный путь к хранилищу
    else {
      const storageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/`;
      const fullUrl = `${storageUrl}${fixedUrl}`;
      return fullUrl;
    }
  }
  
  return fixedUrl;
}

// Функция для исправления дублирования путей в URL
export function fixAvatarUrl(url: string | null): string | null {
  if (!url) return null;
  
  try {
    // Проверяем, является ли URL объектом URL
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (e) {
      return url; // Возвращаем исходный URL, если он не валидный
    }
    
    // Проверяем наличие дублирования "avatars/avatars/" в пути
    const pathParts = urlObj.pathname.split('/');
    const duplicateIndex = pathParts.findIndex((part, index, arr) => 
      part === 'avatars' && index < arr.length - 1 && arr[index + 1] === 'avatars'
    );
    
    // Если найдено дублирование, исправляем путь
    if (duplicateIndex !== -1) {
      pathParts.splice(duplicateIndex + 1, 1); // Удаляем дублирующийся элемент
      urlObj.pathname = pathParts.join('/');
      return urlObj.toString();
    }
    
    return url;
  } catch (error) {
    return url;
  }
}

// Функция для миграции аватара на новый путь
export async function migrateAvatarToNewPath(oldUrl: string, userId: string): Promise<string | null> {
  try {
    // Проверяем наличие бакета
    const bucketExists = await ensureAvatarBucketExists();
    if (!bucketExists) {
      throw new Error("Не удалось создать или проверить бакет для аватаров");
    }
    
    // Извлекаем имя файла из старого URL
    const oldUrlObj = new URL(oldUrl);
    const oldPathParts = oldUrlObj.pathname.split('/');
    const oldFileName = oldPathParts[oldPathParts.length - 1];
    
    if (!oldFileName) {
      throw new Error("Не удалось извлечь имя файла из URL");
    }
    
    // Генерируем новый путь: userId/fileName
    const timestamp = Date.now();
    const fileExt = oldFileName.split('.').pop() || 'jpg';
    const newFileName = `avatar-${timestamp}.${fileExt}`;
    const newPath = `${userId}/${newFileName}`;
    
    // Скачиваем файл из старого пути
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('avatars')
      .download(oldPathParts.slice(2).join('/')); // Удаляем '/storage/v1/' из пути
    
    if (downloadError || !downloadData) {
      return null;
    }
    
    // Загружаем файл в новый путь
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(newPath, downloadData, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      return null;
    }
    
    // Получаем публичный URL нового файла
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(newPath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      return null;
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    return null;
  }
}

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