'use client'

import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, FieldInputProps } from 'formik';
import * as Yup from 'yup';
import { Input, Button } from 'antd';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, debugAuth } from '@/lib/supabase';

const { Title, Text } = Typography;

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Некорректный формат email')
    .required('Email обязателен'),
  password: Yup.string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов')
});

interface LoginFormValues {
  email: string;
  password: string;
}

export default function AuthPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const router = useRouter();
  const { user, error: authError } = useAuth();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  // Проверяем наличие ошибки в параметрах URL
  useEffect(() => {
    if (errorParam) {
      const errorMessage = errorParam.replace(/_/g, ' ');
      messageApi.error(`Ошибка авторизации: ${errorMessage}`);
    }
  }, [errorParam, messageApi]);

  // Если есть ошибка аутентификации из контекста, показываем её
  useEffect(() => {
    if (authError) {
      messageApi.error(`Проблема с сессией: ${authError.message}`);
    }
  }, [authError, messageApi]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);
  
  // Отладочная информация для авторизации
  const handleDebugClick = () => {
    const info = debugAuth();
    setDebugInfo(info);
    setShowDebugInfo(!showDebugInfo);
  };

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      // Очищаем любые стары токены перед новым входом
      await supabase.auth.signOut();
      
      // Пробуем войти с новыми данными
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
      
      if (!data || !data.session) {
        throw new Error('Сессия не создана после успешной авторизации');
      }
      
      messageApi.success('Успешный вход!');
      
      // Делаем небольшую паузу перед редиректом, чтобы токены успели сохраниться
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error);
      messageApi.error(error.message || 'Ошибка входа. Пожалуйста, проверьте ваши данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={2} className="auth-title">Вход в аккаунт</Title>
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Field name="email">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <Input 
                      {...field}
                      prefix={<UserOutlined />} 
                      placeholder="Email" 
                      autoComplete="email"
                      status={errors.email && touched.email ? 'error' : ''}
                    />
                  )}
                </Field>
                <ErrorMessage name="email" component="div" className="error-message" />
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <Field name="password">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined />}
                      placeholder="Пароль"
                      autoComplete="current-password"
                      status={errors.password && touched.password ? 'error' : ''}
                    />
                  )}
                </Field>
                <ErrorMessage name="password" component="div" className="error-message" />
              </div>

              <Button 
                type="primary" 
                htmlType="submit" 
                className="auth-submit-button" 
                block
                loading={loading || isSubmitting}
              >
                Войти
              </Button>
            </Form>
          )}
        </Formik>

        <SocialLoginButtons isRegister={false} />
        
        <Divider plain>или</Divider>
        
        <div className="auth-links">
          <Link href="/register">
            <Button type="default" block>
              Зарегистрироваться
            </Button>
          </Link>
          
          <Link href="/auth/reset-password" className="auth-forgot-password">
            Забыли пароль?
          </Link>
          
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button type="link" size="small" onClick={handleDebugClick}>
              {showDebugInfo ? 'Скрыть отладку' : 'Показать отладку'}
            </Button>
            {showDebugInfo && debugInfo && (
              <div style={{ textAlign: 'left', fontSize: '12px', marginTop: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', background: '#f9f9f9', overflowX: 'auto' }}>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 