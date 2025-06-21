'use client'

import React from 'react';
import { 
  Card, 
  Typography, 
  Switch, 
  Form, 
  Select, 
  Button, 
  Divider, 
  Radio,
  App
} from 'antd';
import { 
  BellOutlined, 
  GlobalOutlined, 
  EyeOutlined, 
  LockOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SettingsPage() {
  const { message: messageApi } = App.useApp();
  const { user } = useAuth();
  const [form] = Form.useForm();

  const handleSettingsUpdate = async (values: any) => {
    try {
      // In a real app, you would save these settings to the database
      // For now, we'll just show a success message
      console.log('Settings updated:', values);
      messageApi.success('Настройки успешно сохранены');
    } catch (error) {
      console.error('Error updating settings:', error);
      messageApi.error('Ошибка при сохранении настроек');
    }
  };

  const SettingsContent = () => (
    <div className="settings-page">
      <Card className="settings-card">
        <Title level={3}>Настройки</Title>
        <Text type="secondary">Управление настройками вашего аккаунта</Text>
        
        <Divider />
        
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            language: 'ru',
            theme: 'light',
            emailNotifications: true,
            pushNotifications: true,
            privacyProfile: 'public',
            twoFactorAuth: false
          }}
          onFinish={handleSettingsUpdate}
        >
          <div className="settings-section">
            <Title level={4}>
              <GlobalOutlined /> Общие настройки
            </Title>
            
            <Form.Item
              name="language"
              label="Язык"
            >
              <Select>
                <Option value="ru">Русский</Option>
                <Option value="en">English</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="theme"
              label="Тема"
            >
              <Radio.Group>
                <Radio value="light">Светлая</Radio>
                <Radio value="dark">Темная</Radio>
                <Radio value="system">Системная</Radio>
              </Radio.Group>
            </Form.Item>
          </div>
          
          <Divider />
          
          <div className="settings-section">
            <Title level={4}>
              <BellOutlined /> Уведомления
            </Title>
            
            <Form.Item
              name="emailNotifications"
              label="Email уведомления"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="pushNotifications"
              label="Push уведомления"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
          
          <Divider />
          
          <div className="settings-section">
            <Title level={4}>
              <EyeOutlined /> Приватность
            </Title>
            
            <Form.Item
              name="privacyProfile"
              label="Видимость профиля"
            >
              <Select>
                <Option value="public">Публичный</Option>
                <Option value="friends">Только друзья</Option>
                <Option value="private">Приватный</Option>
              </Select>
            </Form.Item>
          </div>
          
          <Divider />
          
          <div className="settings-section">
            <Title level={4}>
              <LockOutlined /> Безопасность
            </Title>
            
            <Form.Item
              name="twoFactorAuth"
              label="Двухфакторная аутентификация"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large">
              Сохранить настройки
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
} 