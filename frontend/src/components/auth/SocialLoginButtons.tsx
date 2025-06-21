'use client'

import React, { useState } from 'react';
import { Button, Divider, App } from 'antd';
import { 
  GoogleOutlined, 
  GithubOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { signInWithProvider } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SocialLoginButtonsProps {
  isRegister?: boolean;
}

export default function SocialLoginButtons({ isRegister = false }: SocialLoginButtonsProps) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(provider);
      
      // Реальный вход через провайдера
      await signInWithProvider(provider);
      // The redirect will happen automatically, no need to handle it here
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      message.error(`Ошибка входа через ${provider}. Пожалуйста, попробуйте еще раз.`);
    } finally {
      setLoading(null);
    }
  };

  // Don't show social login buttons if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="social-login-container">
      <Divider plain>{isRegister ? 'Зарегистрироваться через' : 'Войти через'}</Divider>
      
      <div className="social-buttons">
        <Button 
          className="social-button google"
          onClick={() => handleSocialLogin('google')}
          disabled={!!loading}
          icon={loading === 'google' ? <LoadingOutlined /> : <GoogleOutlined />}
        >
          Google
        </Button>
        
        <Button 
          className="social-button github"
          onClick={() => handleSocialLogin('github')}
          disabled={!!loading}
          icon={loading === 'github' ? <LoadingOutlined /> : <GithubOutlined />}
        >
          GitHub
        </Button>
      </div>
    </div>
  );
} 