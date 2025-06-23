'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserProfile, checkAndRestoreSession } from '@/lib/supabase';
import { authApi, usersApi } from '@/lib/api';

// Определение типа для профиля пользователя
interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  full_name?: string;
  created_at?: string;
}

// Определение типа для контекста аутентификации
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  useDirectSupabase: boolean;
  setUseDirectSupabase: (value: boolean) => void;
  error: Error | null;
}

// Создание контекста
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Провайдер контекста
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [useDirectSupabase, setUseDirectSupabase] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(0);

  // Загрузка профиля пользователя - оптимизированная версия
  const loadUserProfile = useCallback(async (userId: string) => {
    if (profileLoading || !userId) return;
    
    setProfileLoading(true);
    try {
      // Проверяем кэш сначала
      const cacheKey = `user_profile_${userId}`;
      const cachedProfile = sessionStorage.getItem(cacheKey);
      
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          setProfile(parsed);
          setProfileLoading(false);
          
          // Если кэш свежее 5 минут, не запрашиваем повторно
          const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
          if (cacheTime && (Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000) {
            return;
          }
        } catch (e) {}
      }
      
      if (useDirectSupabase) {
        const { data, error } = await getUserProfile(userId);
        if (error) throw error;
        if (data) {
          setProfile(data);
          // Кэшируем профиль
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
      } else {
        const data = await usersApi.getProfile(userId);
        if (data && !data.skipped) {
          setProfile(data);
          // Кэшируем профиль
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [useDirectSupabase, profileLoading]);

  // Проверка сессии с ограничением частоты
  const checkSessionIfNeeded = useCallback(async () => {
    // Предотвращаем слишком частые проверки сессии
    const now = Date.now();
    if (now - lastAuthCheck < 10000) { // Не чаще 1 раза в 10 секунд
      console.log('Skipping auth check - too frequent');
      return;
    }
    
    setLastAuthCheck(now);
    setLoading(true);
    
    try {
      // Пытаемся восстановить сессию с разных источников
      const restoredSession = await checkAndRestoreSession();
      if (restoredSession) {
        setSession(restoredSession);
        setUser(restoredSession.user);
        
        // Загружаем профиль только если он еще не загружен
        if (!profile && restoredSession.user) {
          await loadUserProfile(restoredSession.user.id);
        }
        setError(null);
        return;
      }
      
      // Если восстановление не удалось, пробуем получить сессию
      const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        
        // Загружаем профиль только если он еще не загружен
        if (!profile && newSession.user) {
          await loadUserProfile(newSession.user.id);
        }
        setError(null);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error loading auth session:', err);
      setError(err instanceof Error ? err : new Error('Не удалось загрузить сессию'));
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile, lastAuthCheck, profile]);

  // Инициализация аутентификации при загрузке
  useEffect(() => {
    let isMounted = true;
    let authStateUnsubscribe: any = null;
    
    // Асинхронная функция для загрузки первоначального состояния
    async function initializeAuth() {
      if (!isMounted) return;
      
      await checkSessionIfNeeded();
      
      // Подписываемся на изменения аутентификации, но только один раз
      if (!authStateUnsubscribe) {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return;
            
            console.log('Auth state changed:', event);
            
            // Обновляем состояние только при реальных изменениях
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
              setSession(newSession);
              setUser(newSession?.user ?? null);
              
              if (newSession?.user) {
                await loadUserProfile(newSession.user.id);
              } else {
                setProfile(null);
              }
            }
          }
        );
        
        authStateUnsubscribe = data.subscription;
      }
    }
    
    // Запускаем инициализацию
    initializeAuth();
    
    // Очистка при размонтировании
    return () => {
      isMounted = false;
      if (authStateUnsubscribe) {
        authStateUnsubscribe.unsubscribe();
      }
    };
  }, [checkSessionIfNeeded, loadUserProfile]);

  // Вход в систему
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Используем бэкенд API
        await authApi.login(email, password);
      }
      
      // Обновляем время последней проверки
      setLastAuthCheck(Date.now());
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [useDirectSupabase]);

  // Регистрация
  const signUp = useCallback(async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      } else {
        // Используем бэкенд API
        await authApi.register(email, password, username);
      }
      
      // Обновляем время последней проверки
      setLastAuthCheck(Date.now());
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [useDirectSupabase]);

  // Выход из системы
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        await supabase.auth.signOut();
      } else {
        // Используем бэкенд API
        await authApi.logout();
      }
      
      // Очищаем локальное состояние
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Обновляем время последней проверки
      setLastAuthCheck(Date.now());
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [useDirectSupabase]);

  // Сброс пароля
  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
      } else {
        // Используем бэкенд API
        await authApi.resetPassword(email);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [useDirectSupabase]);

  // Обновление профиля
  const updateProfile = useCallback(async (userData: Partial<UserProfile>) => {
    if (!user) throw new Error('No authenticated user');
    
    setProfileLoading(true);
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        const { error } = await supabase
          .from('profiles')
          .update(userData)
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Обновляем локальный профиль
        setProfile(prev => prev ? { ...prev, ...userData } : null);
        
        // Обновляем кэш
        const cacheKey = `user_profile_${user.id}`;
        const cachedProfile = sessionStorage.getItem(cacheKey);
        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            const updated = { ...parsed, ...userData };
            sessionStorage.setItem(cacheKey, JSON.stringify(updated));
            sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
          } catch (e) {}
        }
      } else {
        // Используем бэкенд API
        await usersApi.updateProfile(user.id, userData);
        
        // Обновляем локальный профиль
        setProfile(prev => prev ? { ...prev, ...userData } : null);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  }, [user, useDirectSupabase]);

  const contextValue = {
    user,
    profile,
    session,
    loading,
    profileLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    useDirectSupabase,
    setUseDirectSupabase,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста
export function useAuth() {
  return useContext(AuthContext);
} 