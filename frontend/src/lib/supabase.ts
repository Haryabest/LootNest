import { createClient } from '@supabase/supabase-js';

// Получаем URL и ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Создаем клиент Supabase с оптимизированными настройками и JWT
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Меняем обратно на true для надежности сессии
    autoRefreshToken: true, // Автоматически обновляем токен
    detectSessionInUrl: true, // Обнаруживает токен в URL
    flowType: 'pkce', // Более безопасный тип авторизации
    storage: {
      // Используем кастомное хранилище для JWT токенов
      getItem: (key: string): string | null => {
        // Проверяем доступность window
        if (typeof window === 'undefined') return null;
        
        // Получаем токен из memory storage или cookie
        const token = sessionStorage.getItem(key) || 
                      document.cookie.split('; ').find(row => row.startsWith(key))?.split('=')[1];
        
        // Явно преобразуем undefined в null для соответствия типу
        return token || null;
      },
      setItem: (key: string, value: string) => {
        // Проверяем доступность window
        if (typeof window === 'undefined') return;
        
        try {
          // Сохраняем токен в memory storage и cookie с более длительным сроком жизни
          sessionStorage.setItem(key, value);
          
          // Увеличиваем время жизни cookie до 7 дней
          const maxAge = 7 * 24 * 60 * 60; // 7 дней в секундах
          document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Strict; secure`;
          
          // Также дублируем в localStorage для лучшей персистентности
          localStorage.setItem(`${key}_backup`, value);
        } catch (e) {
          console.error('Error saving auth token:', e);
        }
      },
      removeItem: (key: string) => {
        // Проверяем доступность window
        if (typeof window === 'undefined') return;
        
        try {
          // Удаляем токен из всех хранилищ
          sessionStorage.removeItem(key);
          localStorage.removeItem(`${key}_backup`);
          document.cookie = `${key}=; path=/; max-age=0; SameSite=Strict`;
        } catch (e) {
          console.error('Error removing auth token:', e);
        }
      }
    }
  },
  global: {
    fetch: (url, options) => {
      // Устанавливаем максимальное время ожидания
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000) // Таймаут 10 секунд
      });
    }
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

// Функция для проверки и восстановления сессии
export async function checkAndRestoreSession() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Сначала проверяем сессию стандартным способом
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) return session;
    
    if (error) {
      console.warn('Error getting session:', error);
      
      // Пробуем восстановить из localStorage, если основная сессия не найдена
      const sessionKey = 'supabase.auth.token';
      const backupToken = localStorage.getItem(`${sessionKey}_backup`);
      
      if (backupToken) {
        try {
          // Установим backup токен в основное хранилище и попробуем заново
          sessionStorage.setItem(sessionKey, backupToken);
          document.cookie = `${sessionKey}=${backupToken}; path=/; max-age=3600; SameSite=Strict`;
          
          // Повторно проверяем сессию
          const { data: { session: restoredSession } } = await supabase.auth.getSession();
          if (restoredSession) {
            console.log('Session restored from backup');
            return restoredSession;
          }
        } catch (backupError) {
          console.error('Failed to restore session from backup:', backupError);
        }
      }
    }
  } catch (e) {
    console.error('Error in checkAndRestoreSession:', e);
  }
  
  return null;
}

// Функция для отладки процесса аутентификации
export function debugAuth() {
  if (typeof window === 'undefined') return null;
  
  try {
    const debugInfo = {
      storageAvailable: {
        localStorage: storage.localStorageAvailable(),
        sessionStorage: storage.sessionStorageAvailable(),
        cookies: storage.cookiesAvailable()
      },
      tokens: {
        hasSessionToken: !!sessionStorage.getItem('supabase.auth.token'),
        hasBackupToken: !!localStorage.getItem('supabase.auth.token_backup'),
        hasCookieToken: document.cookie.includes('supabase.auth.token')
      }
    };
    
    console.log('Auth Debug Info:', debugInfo);
    return debugInfo;
  } catch (e) {
    console.error('Error during auth debugging:', e);
    return { error: String(e) };
  }
}

// Вспомогательные функции для проверки доступности storage
const storage = {
  localStorageAvailable: () => {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  sessionStorageAvailable: () => {
    try {
      const testKey = '__test__';
      sessionStorage.setItem(testKey, testKey);
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  cookiesAvailable: () => {
    try {
      document.cookie = "__test__=test; max-age=10";
      return document.cookie.includes('__test__');
    } catch (e) {
      return false;
    }
  }
} 