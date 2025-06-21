'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '@/lib/supabase';
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  useDirectSupabase: boolean;
  setUseDirectSupabase: (value: boolean) => void;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [useDirectSupabase, setUseDirectSupabase] = useState(true);

  // Загрузка сессии при первом рендере
  useEffect(() => {
    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    // Подписка на изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Загрузка профиля пользователя
  async function loadUserProfile(userId: string) {
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        const { data, error } = await getUserProfile(userId);
        if (error) throw error;
        setProfile(data);
      } else {
        // Используем бэкенд API
        const data = await usersApi.getProfile(userId);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Вход в систему
  async function signIn(email: string, password: string) {
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
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Регистрация
  async function signUp(email: string, password: string, username: string) {
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
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Выход из системы
  async function signOut() {
    setLoading(true);
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        // Используем бэкенд API
        await authApi.logout();
      }
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Сброс пароля
  async function resetPassword(email: string) {
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
  }

  // Обновление профиля
  async function updateProfile(data: Partial<UserProfile>) {
    if (!user) return;
    
    setLoading(true);
    try {
      if (useDirectSupabase) {
        // Используем прямой доступ к Supabase
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', user.id)
          .select()
          .single();
          
        if (error) throw error;
        setProfile(updatedProfile);
      } else {
        // Используем бэкенд API
        const updatedProfile = await usersApi.updateProfile(user.id, data);
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    useDirectSupabase,
    setUseDirectSupabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Хук для использования контекста
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 