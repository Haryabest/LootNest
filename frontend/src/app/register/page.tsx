'use client'

import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, FieldInputProps } from 'formik';
import * as Yup from 'yup';
import { Input, Button } from 'antd';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const { Title, Text } = Typography;

// Validation schema
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .required('Имя пользователя обязательно')
    .min(3, 'Имя пользователя должно содержать минимум 3 символа')
    .max(20, 'Имя пользователя должно содержать максимум 20 символов'),
  email: Yup.string()
    .email('Некорректный формат email')
    .required('Email обязателен'),
  password: Yup.string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: Yup.string()
    .required('Подтверждение пароля обязательно')
    .oneOf([Yup.ref('password')], 'Пароли не совпадают'),
  agreement: Yup.boolean()
    .required('Необходимо принять условия')
    .oneOf([true], 'Необходимо принять условия')
});

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
}

export default function RegisterPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    
    try {
      // Проверим, существует ли пользователь с таким email
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', values.email);
        
      if (searchError) {
        console.warn('Error checking existing email:', searchError);
      }
      
      if (existingUsers && existingUsers.length > 0) {
        messageApi.error('Пользователь с таким email уже существует.');
        setLoading(false);
        return;
      }
      
      // Проверим, существует ли пользователь с таким username
      const { data: existingUsernames, error: usernameError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', values.username);
        
      if (usernameError) {
        console.warn('Error checking existing username:', usernameError);
      }
      
      if (existingUsernames && existingUsernames.length > 0) {
        messageApi.error('Это имя пользователя уже занято.');
        setLoading(false);
        return;
      }

      // Регистрация с подтверждением email
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            username: values.username,
            full_name: '',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Создаем профиль пользователя сразу после регистрации
      if (data.user) {
        try {
          // Проверяем, не создан ли уже профиль
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (!existingProfile) {
            // Создаем новый профиль
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: data.user.id,
                  username: values.username,
                  email: values.email,
                  created_at: new Date().toISOString(),
                },
              ]);

            if (profileError) {
              console.error('Error creating profile:', profileError);
              messageApi.warning('Аккаунт создан, но возникла проблема с профилем. Пожалуйста, заполните профиль позже.');
            }
          }
        } catch (profileErr) {
          console.error('Error in profile creation:', profileErr);
          messageApi.warning('Аккаунт создан, но возникла проблема с профилем. Пожалуйста, заполните профиль позже.');
        }

        messageApi.success('Регистрация успешна! Пожалуйста, проверьте вашу почту для подтверждения аккаунта.');
        
        // Делаем небольшую паузу перед редиректом
        setTimeout(() => {
          router.push('/auth');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      messageApi.error(error.message || 'Ошибка регистрации. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={2} className="auth-title">Регистрация</Title>
        
        <Formik
          initialValues={{ 
            username: '', 
            email: '', 
            password: '', 
            confirmPassword: '', 
            agreement: false 
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values, setFieldValue }) => (
            <Form className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Имя пользователя</label>
                <Field name="username">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <Input 
                      {...field}
                      prefix={<UserOutlined />} 
                      placeholder="Имя пользователя" 
                      autoComplete="username"
                      status={errors.username && touched.username ? 'error' : ''}
                    />
                  )}
                </Field>
                <ErrorMessage name="username" component="div" className="error-message" />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Field name="email">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <Input 
                      {...field}
                      prefix={<MailOutlined />} 
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
                      autoComplete="new-password"
                      status={errors.password && touched.password ? 'error' : ''}
                    />
                  )}
                </Field>
                <ErrorMessage name="password" component="div" className="error-message" />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <Field name="confirmPassword">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined />}
                      placeholder="Подтвердите пароль"
                      autoComplete="new-password"
                      status={errors.confirmPassword && touched.confirmPassword ? 'error' : ''}
                    />
                  )}
                </Field>
                <ErrorMessage name="confirmPassword" component="div" className="error-message" />
              </div>
              
              <div className="form-group checkbox-group">
                <Field name="agreement">
                  {({ field }: { field: FieldInputProps<boolean> }) => (
                    <Checkbox 
                      {...field} 
                      checked={field.value}
                      onChange={e => setFieldValue('agreement', e.target.checked)}
                    >
                      Я принимаю <Link href="/terms">условия пользовательского соглашения</Link>
                    </Checkbox>
                  )}
                </Field>
                <ErrorMessage name="agreement" component="div" className="error-message" />
              </div>

              <Button 
                type="primary" 
                htmlType="submit" 
                className="auth-submit-button" 
                block
                loading={loading || isSubmitting}
              >
                Зарегистрироваться
              </Button>
            </Form>
          )}
        </Formik>

        <SocialLoginButtons isRegister={true} />

        <Divider plain>или</Divider>
        
        <div className="auth-links">
          <Link href="/auth">
            <Button type="default" block>
              У меня уже есть аккаунт
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
} 