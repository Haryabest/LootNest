'use client'

import React, { useState, useEffect } from 'react';
import { Card, Typography, App } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage, FieldInputProps } from 'formik';
import * as Yup from 'yup';
import { Input, Button } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const { Title, Text } = Typography;

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Некорректный формат email')
    .required('Email обязателен'),
});

interface ResetPasswordFormValues {
  email: string;
}

export default function ResetPasswordPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      
      setEmailSent(true);
      messageApi.success('Инструкции по сбросу пароля отправлены на вашу почту');
    } catch (error: any) {
      console.error('Reset password error:', error);
      messageApi.error(error.message || 'Ошибка при отправке инструкций. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <Title level={2} className="auth-title">Сброс пароля</Title>
        
        {emailSent ? (
          <div className="reset-success">
            <Text>
              Инструкции по сбросу пароля отправлены на вашу почту. 
              Пожалуйста, проверьте вашу электронную почту и следуйте инструкциям.
            </Text>
            <div className="auth-links" style={{ marginTop: '24px' }}>
              <Link href="/auth">
                <Button type="primary" block>
                  Вернуться на страницу входа
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
              Введите ваш email, и мы отправим вам инструкции по сбросу пароля.
            </Text>
            
            <Formik
              initialValues={{ email: '' }}
              validationSchema={ResetPasswordSchema}
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
                          prefix={<MailOutlined />} 
                          placeholder="Email" 
                          autoComplete="email"
                          status={errors.email && touched.email ? 'error' : ''}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="email" component="div" className="error-message" />
                  </div>

                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className="auth-submit-button" 
                    block
                    loading={loading || isSubmitting}
                  >
                    Отправить инструкции
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