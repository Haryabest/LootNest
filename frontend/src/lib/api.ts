// API клиент для взаимодействия с бэкендом

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Простое кэширование запросов
const requestCache = new Map();
const CACHE_DURATION = 300 * 1000; // Увеличиваем время кэширования до 5 минут

// Получение JWT токена
function getAuthToken() {
  if (typeof window === 'undefined') return '';
  
  // Проверяем сначала в sessionStorage
  let token = sessionStorage.getItem('supabase.auth.token');
  
  // Если токен не найден, проверяем в cookie
  if (!token) {
    const tokenCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('supabase.auth.token'));
    
    if (tokenCookie) {
      token = tokenCookie.split('=')[1];
    }
  }
  
  if (token) {
    try {
      // Если токен в формате JSON, извлекаем access_token
      const parsedToken = JSON.parse(token);
      return parsedToken?.currentSession?.access_token || '';
    } catch (e) {
      // Если это просто строка с токеном, возвращаем как есть
      return token;
    }
  }
  
  return '';
}

// Проверяем нужно ли отключить разогрев API
function shouldSkipWarmup() {
  if (typeof window === 'undefined') return true;
  
  return localStorage.getItem('disable_api_warmup') === 'true' ||
         sessionStorage.getItem('skip_session_check') === 'true';
}

// Вспомогательная функция для запросов
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Проверяем состояние "разогрева" API
  if (shouldSkipWarmup() && url.includes('/profile')) {
    console.log('🔍 Skipping API warmup request to:', url);
    return Promise.resolve({ skipped: true });
  }

  // Если это GET запрос, пробуем вернуть данные из кэша
  const cacheKey = `${options.method || 'GET'}_${url}_${JSON.stringify(options.body || {})}`;
  if ((options.method === undefined || options.method === 'GET') && requestCache.has(cacheKey)) {
    const cacheEntry = requestCache.get(cacheKey);
    if (Date.now() - cacheEntry.timestamp < CACHE_DURATION) {
      return cacheEntry.data;
    }
    // Кэш устарел, удаляем его
    requestCache.delete(cacheKey);
  }

  // Получаем токен с использованием оптимизированного метода
  const token = getAuthToken();

  // Добавляем заголовки авторизации
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  // Устанавливаем приоритет для запроса
  const priority = url.includes('profile') ? 'low' : 'auto';

  // Функция для повторных попыток запроса
  async function attemptFetch(retries = 2): Promise<any> {  // Уменьшаем число повторов до 2
    try {
      // Добавляем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Уменьшаем таймаут до 3 секунд
      
      const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
        signal: controller.signal,
        // @ts-ignore - Приоритет для fetch API доступен в новых браузерах
        priority: priority
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Не разбираем JSON для ошибок, чтобы не тратить ресурсы
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Сохраняем GET-запросы в кэш
      if (options.method === undefined || options.method === 'GET') {
        requestCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Request timeout:', url);
      }
      
      // Если остались попытки, повторяем запрос
      if (retries > 0 && !shouldSkipWarmup()) {  // Пропускаем повторы если установлен флаг пропуска
        return attemptFetch(retries - 1);
      }
      
      // Для не критичных запросов возвращаем пустой ответ вместо ошибки
      if (url.includes('/profile') || url.includes('/users/')) {
        console.warn(`Returning empty response for non-critical request: ${url}`);
        return {};
      }
      
      throw error;
    }
  }

  return attemptFetch();
}

// API для аутентификации
export const authApi = {
  // Вход в систему
  async login(email: string, password: string) {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Регистрация
  async register(email: string, password: string, username: string) {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
  },

  // Сброс пароля
  async resetPassword(email: string) {
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Обновление пароля
  async updatePassword(password: string) {
    return fetchWithAuth('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // Выход из системы
  async logout() {
    return fetchWithAuth('/auth/logout', {
      method: 'POST',
    });
  },
};

// API для работы с пользователями
export const usersApi = {
  // Получение профиля пользователя
  async getProfile(userId: string) {
    // Проверяем, нужно ли пропустить этот запрос для ускорения загрузки
    if (shouldSkipWarmup()) {
      return Promise.resolve({ id: userId, skipped: true });
    }
    
    return fetchWithAuth(`/users/${userId}/profile`);
  },

  // Обновление профиля пользователя
  async updateProfile(userId: string, userData: any) {
    return fetchWithAuth(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
}; 