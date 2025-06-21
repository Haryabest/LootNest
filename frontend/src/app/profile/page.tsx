'use client'

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Avatar, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Divider,
  Upload,
  App
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  UploadOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function ProfilePage() {
  const { message: messageApi } = App.useApp();
  const { user, profile } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const handleProfileUpdate = async (values: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          full_name: values.fullName,
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      messageApi.success('Профиль успешно обновлен');
    } catch (error) {
      console.error('Error updating profile:', error);
      messageApi.error('Ошибка при обновлении профиля');
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;
      
      messageApi.success('Пароль успешно изменен');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Error changing password:', error);
      messageApi.error('Ошибка при изменении пароля');
    }
  };

  const handleAvatarUpload = async (options: any) => {
    const { file } = options;
    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      messageApi.success('Аватар успешно обновлен');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      messageApi.error('Ошибка при загрузке аватара');
    } finally {
      setUploading(false);
    }
  };

  const ProfileContent = () => (
    <div className="profile-page">
      <Card className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-section">
            <Avatar 
              size={100} 
              src={profile?.avatar_url}
              icon={!profile?.avatar_url && <UserOutlined />}
            />
            <Upload
              name="avatar"
              showUploadList={false}
              customRequest={handleAvatarUpload}
              accept="image/*"
            >
              <Button 
                icon={<UploadOutlined />} 
                loading={uploading}
                className="upload-button"
              >
                Изменить аватар
              </Button>
            </Upload>
          </div>
          <div className="profile-info">
            <Title level={3}>{profile?.full_name || profile?.username || user?.email}</Title>
            <Text type="secondary">{user?.email}</Text>
          </div>
        </div>

        <Divider />

        <Tabs defaultActiveKey="profile">
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                Профиль
              </span>
            } 
            key="profile"
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                username: profile?.username || '',
                fullName: profile?.full_name || '',
                email: user?.email || '',
              }}
              onFinish={handleProfileUpdate}
            >
              <Form.Item
                name="username"
                label="Имя пользователя"
                rules={[
                  { required: true, message: 'Пожалуйста, введите имя пользователя' },
                  { min: 3, message: 'Имя пользователя должно содержать минимум 3 символа' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Имя пользователя" />
              </Form.Item>

              <Form.Item
                name="fullName"
                label="Полное имя"
              >
                <Input prefix={<UserOutlined />} placeholder="Полное имя" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Email" 
                  disabled 
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Сохранить изменения
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane 
            tab={
              <span>
                <LockOutlined />
                Безопасность
              </span>
            } 
            key="security"
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="newPassword"
                label="Новый пароль"
                rules={[
                  { required: true, message: 'Пожалуйста, введите новый пароль' },
                  { min: 8, message: 'Пароль должен содержать минимум 8 символов' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message: 'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы'
                  }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Новый пароль" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Подтвердите пароль"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Пожалуйста, подтвердите пароль' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Пароли не совпадают'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Подтвердите пароль" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Изменить пароль
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );

  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
} 