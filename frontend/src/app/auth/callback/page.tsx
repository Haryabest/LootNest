'use client'

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Spin, Typography } from 'antd';

const { Title, Text } = Typography;

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Обработка параметров из URL - важно для OAuth и подтверждения регистрации
        const code = searchParams.get('code');
        
        if (!code) {
          console.warn('No code parameter in URL');
        }
        
        // Попытка получить сессию сразу с обработкой URL параметров
        const { data, error } = await supabase.auth.exchangeCodeForSession(code || '');
        
        if (error || !data.session) {
          // Если не удалось получить сессию через код, пробуем получить существующую
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw sessionError || new Error('No session found');
          }
          
          // Создаем профиль для существующей сессии
          await createUserProfile(session.user);
          router.push('/');
          return;
        }
        
        // Создаем профиль для новой сессии
        await createUserProfile(data.session.user);
        
        // Redirect to home page or dashboard
        router.push('/');
      } catch (error) {
        console.error('Error during auth callback:', error);
        router.push('/auth?error=Authentication_failed');
      }
    };
    
    async function createUserProfile(user: any) {
      if (!user || !user.id) {
        console.error('No user data available to create profile');
        return;
      }
      
      try {
        // Проверяем существование профиля
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (existingProfile) {
          console.log('Profile already exists');
          return;
        }
        
        // Создаем новый профиль если его нет
        const username = user.user_metadata?.username || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'user_' + Math.random().toString(36).substring(2, 8);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username: username,
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url,
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
        
        console.log('Profile created successfully');
      } catch (error) {
        console.error('Error in profile creation:', error);
        throw new Error(`Error creating profile: ${JSON.stringify(error)}`);
      }
    }

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="auth-callback-page">
      <div className="auth-callback-container">
        <Spin size="large" />
        <Title level={3} style={{ marginTop: 24 }}>Выполняется вход...</Title>
        <Text type="secondary">Пожалуйста, подождите, пока мы завершим процесс аутентификации.</Text>
      </div>
    </div>
  );
} 