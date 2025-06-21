'use client'

import React, { useState, useEffect } from 'react';
import { Card, Typography, App } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, FieldInputProps } from 'formik';
import * as Yup from 'yup';
import { Input, Button } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const { Title, Text } = Typography;

// Validation schema
const UpdatePasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required('Пароль обязателен')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: Yup.string()
    .required('Подтверждение пароля обязательно')
    .oneOf([Yup.ref('password')], 'Пароли не совпадают'),
});

interface UpdatePasswordFormValues {
  password: string;
  confirmPassword: string;
}

export default function UpdatePasswordPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (values: UpdatePasswordFormValues) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;
      
      setSuccess(true);
      messageApi.success('Пароль успешно обновлен');
    } catch (error: any) {
      console.error('Update password error:', error);
      messageApi.error(error.message || 'Ошибка при обновлении пароля. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={2} className="auth-title">Обновление пароля</Title>
        
        {success ? (
          <div className="reset-success">
            <Text>
              Ваш пароль был успешно обновлен. Теперь вы можете войти с новым паролем.
            </Text>
            <div className="auth-links" style={{ marginTop: '24px' }}>
              <Link href="/auth">
                <Button type="primary" block>
                  Перейти на страницу входа
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
              Введите новый пароль для вашего аккаунта.
            </Text>
            
            <Formik
              initialValues={{ password: '', confirmPassword: '' }}
              validationSchema={UpdatePasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="auth-form">
                  <div className="form-group">
                    <label htmlFor="password">Новый пароль</label>
                    <Field name="password">
                      {({ field }: { field: FieldInputProps<string> }) => (
                        <Input.Password
                          {...field}
                          prefix={<LockOutlined />}
                          placeholder="Новый пароль"
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

                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className="auth-submit-button" 
                    block
                    loading={loading || isSubmitting}
                  >
                    Обновить пароль
                  </Button>
                </Form>
              )}
            </Formik>
            
            <div className="auth-links" style={{ marginTop: '24px' }}>
              <Link href="/auth">
                <Button type="default" block>
                  Вернуться на страницу входа
                </Button>
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
} 