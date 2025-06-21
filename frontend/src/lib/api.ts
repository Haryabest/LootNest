// API клиент для взаимодействия с бэкендом

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Вспомогательная функция для запросов
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Получаем токен из локального хранилища
  let token = '';
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('supabase.auth.token');
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        token = parsedSession?.currentSession?.access_token;
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
  }

  // Добавляем заголовки авторизации
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Выполняем запрос
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // Обрабатываем ответ
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Неизвестная ошибка',
    }));
    throw new Error(error.message || 'Ошибка запроса к API');
  }

  return response.json();
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