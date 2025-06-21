'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Spin, Typography } from 'antd';

const { Title, Text } = Typography;

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          throw error || new Error('No session found');
        }

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // If no profile exists, create one
        if (!profile && !profileError) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session.user.id,
                username: session.user.user_metadata.username || session.user.user_metadata.name || session.user.email?.split('@')[0],
                email: session.user.email,
                avatar_url: session.user.user_metadata.avatar_url,
                created_at: new Date().toISOString(),
              },
            ]);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        }
        
        // Redirect to home page or dashboard
        router.push('/');
      } catch (error) {
        console.error('Error during auth callback:', error);
        router.push('/auth?error=Authentication failed');
      }
    };

    handleAuthCallback();
  }, [router]);

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