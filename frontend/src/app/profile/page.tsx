'use client'

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Avatar, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Divider,
  Upload,
  App,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Progress,
  Modal,
  Tooltip,
  message
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  UploadOutlined,
  ShoppingOutlined,
  DollarOutlined,
  StarOutlined,
  TrophyOutlined,
  RiseOutlined,
  EditOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, ensureAvatarBucketExists, getAvatarUrl, migrateAvatarToNewPath, fixAvatarUrl } from '@/lib/supabase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
  const { message: messageApi } = App.useApp();
  const { user, profile, updateProfile } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Проверяем наличие бакета при загрузке компонента
  useEffect(() => {
    const checkBucket = async () => {
      try {
        await ensureAvatarBucketExists();
      } catch (error) {
        console.error("Error checking bucket:", error);
      }
    };
    
    checkBucket();
  }, []);

  // Обновляем аватар при изменении профиля или ключа обновления
  useEffect(() => {
    const updateAvatarUrl = async () => {
      try {
        if (profile?.avatar_url) {
          // Проверяем, нужна ли миграция аватара
          if (profile.avatar_url.includes('avatars/avatars/') && user?.id) {
            // Мигрируем аватар на новую структуру путей
            const newAvatarUrl = await migrateAvatarToNewPath(user.id, profile.avatar_url);
            
            if (newAvatarUrl && newAvatarUrl !== profile.avatar_url) {
              // Обновляем профиль с новым URL
              await updateProfile({
                avatar_url: newAvatarUrl
              });
              
              // Выходим из функции, так как обновление профиля вызовет повторный рендер
              return;
            }
          }
          
          // Исправляем URL если он имеет неправильный формат
          const fixedUrl = fixAvatarUrl(profile.avatar_url);
          
          // Получаем полный URL с обработкой разных форматов
          const fullUrl = getAvatarUrl(fixedUrl);
          
          // Добавляем случайный параметр к URL для обхода кеширования
          const timestamp = new Date().getTime();
          const url = fullUrl ? `${fullUrl}?t=${timestamp}` : null;
          
          setAvatarUrl(url);
        } else {
          setAvatarUrl(null);
        }
      } catch (error) {
        console.error("Ошибка при обновлении URL аватара:", error);
      }
    };
    
    updateAvatarUrl();
  }, [profile, refreshKey, user?.id, updateProfile]);

  // Моковые данные для статистики
  const mockStats = {
    totalSales: 12,
    totalPurchases: 8,
    revenue: 1250.50,
    rating: 4.7,
    completedDeals: 20,
    pendingDeals: 2,
    recentActivity: [
      { id: 1, title: 'Аккаунт CS:GO с ножом', type: 'sale', price: 350, date: '2023-06-20', status: 'completed' },
      { id: 2, title: 'Скин AWP Dragon Lore', type: 'purchase', price: 750, date: '2023-06-15', status: 'completed' },
      { id: 3, title: 'Ключи Steam x5', type: 'sale', price: 50, date: '2023-06-10', status: 'pending' },
    ],
    popularCategories: [
      { name: 'Шутеры', count: 8 },
      { name: 'Скины', count: 5 },
      { name: 'Аккаунты', count: 4 },
    ],
    trustLevel: 85
  };

  const handleProfileUpdate = async (values: any) => {
    try {
      await updateProfile({
        username: values.username,
        full_name: values.fullName,
      });
      
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

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      messageApi.error('Имя пользователя не может быть пустым');
      return;
    }
    
    setUsernameLoading(true);
    try {
      await updateProfile({
        username: newUsername,
      });
      
      setUsernameModalVisible(false);
      messageApi.success('Имя пользователя успешно изменено');
    } catch (error) {
      console.error('Error updating username:', error);
      messageApi.error('Ошибка при изменении имени пользователя');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleAvatarUpload = async (options: any) => {
    const { file } = options;
    setUploading(true);

    try {
      // Создаем временное превью для немедленного отображения
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);

      // Проверяем наличие бакета и создаем его при необходимости
      const bucketExists = await ensureAvatarBucketExists();
      
      if (!bucketExists) {
        throw new Error('Не удалось создать или проверить бакет для аватаров');
      }
      
      // Проверяем размер файла (макс. 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Размер файла не должен превышать 2MB');
      }

      // Проверяем тип файла
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        throw new Error('Поддерживаются только форматы JPG, PNG и GIF');
      }

      if (!user?.id) {
        throw new Error('Пользователь не авторизован');
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `avatar-${timestamp}.${fileExt}`;
      
      // Используем структуру пути, которая соответствует политикам RLS
      // Формат: userId/fileName (без префикса avatars, т.к. он уже в имени бакета)
      const filePath = `${user.id}/${fileName}`;

      // Загружаем файл в хранилище
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (!publicUrl || !publicUrl.publicUrl) {
        throw new Error('Не удалось получить публичный URL для загруженного файла');
      }
      
      // Проверяем URL на корректность
      const avatarUrl = publicUrl.publicUrl;
      
      // Обрабатываем URL для гарантии полного пути
      const fullAvatarUrl = getAvatarUrl(avatarUrl);

      // Проверяем доступность URL перед обновлением профиля
      try {
        const checkResponse = await fetch(fullAvatarUrl || '', { method: 'HEAD' });
        
        if (!checkResponse.ok) {
          // Продолжаем выполнение, даже если проверка не удалась
        }
      } catch (checkError) {
        // Продолжаем выполнение, даже если проверка не удалась
      }

      // Обновляем профиль с новым URL аватара
      await updateProfile({ 
        avatar_url: avatarUrl 
      });

      // Сохраняем URL в локальном состоянии с параметром для обхода кеширования
      const cacheTimestamp = new Date().getTime();
      const finalUrl = fullAvatarUrl ? `${fullAvatarUrl}?t=${cacheTimestamp}` : null;
      setAvatarUrl(finalUrl);
      
      // Принудительно обновляем аватар через небольшую задержку
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 500);

      messageApi.success('Аватар успешно обновлен');
    } catch (error: any) {
      // Возвращаем старый аватар в случае ошибки
      const oldAvatarUrl = getAvatarUrl(profile?.avatar_url || null);
      setAvatarUrl(oldAvatarUrl);
      messageApi.error(`Ошибка при загрузке аватара: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Определяем элементы вкладок в новом формате
  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <RiseOutlined />
          Дашборд
        </span>
      ),
      children: (
        <div className="dashboard-content">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <div className="stat-card">
                <Statistic 
                  title="Всего продаж" 
                  value={mockStats.totalSales} 
                  prefix={<ShoppingOutlined />} 
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="stat-card">
                <Statistic 
                  title="Всего покупок" 
                  value={mockStats.totalPurchases} 
                  prefix={<ShoppingOutlined />} 
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="stat-card">
                <Statistic 
                  title="Доход" 
                  value={mockStats.revenue} 
                  precision={2} 
                  prefix={<DollarOutlined />} 
                  suffix="$" 
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="stat-card">
                <Statistic 
                  title="Рейтинг" 
                  value={mockStats.rating} 
                  precision={1} 
                  prefix={<StarOutlined />} 
                  suffix="/5" 
                />
              </div>
            </Col>
          </Row>

          <Divider orientation="left">Уровень доверия</Divider>
          <div className="trust-level">
            <Progress 
              percent={mockStats.trustLevel} 
              status="active" 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary">
              Высокий уровень доверия увеличивает ваши шансы на успешные сделки
            </Text>
          </div>

          <Divider orientation="left">Последние активности</Divider>
          <List
            className="activity-list"
            itemLayout="horizontal"
            dataSource={mockStats.recentActivity}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={`${item.date} • ${item.price}$`}
                />
                <div>
                  <Tag color={item.type === 'sale' ? 'blue' : 'green'}>
                    {item.type === 'sale' ? 'Продажа' : 'Покупка'}
                  </Tag>
                  <Tag color={item.status === 'completed' ? 'success' : 'warning'}>
                    {item.status === 'completed' ? 'Завершено' : 'В процессе'}
                  </Tag>
                </div>
              </List.Item>
            )}
          />

          <Divider orientation="left">Популярные категории</Divider>
          <div className="popular-categories">
            {mockStats.popularCategories.map(category => (
              <Tag key={category.name} color="blue" style={{ fontSize: '14px', padding: '5px 10px', margin: '5px' }}>
                {category.name} ({category.count})
              </Tag>
            ))}
          </div>

          <Divider orientation="left">Советы по улучшению профиля</Divider>
          <div className="profile-tips">
            <Paragraph>
              <ul>
                <li>Добавьте полное имя для повышения доверия</li>
                <li>Загрузите аватар для узнаваемости</li>
                <li>Регулярно обновляйте информацию о товарах</li>
                <li>Быстро отвечайте на запросы покупателей</li>
              </ul>
            </Paragraph>
          </div>
        </div>
      )
    },
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          Профиль
        </span>
      ),
      children: (
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
      )
    },
    {
      key: 'security',
      label: (
        <span>
          <LockOutlined />
          Безопасность
        </span>
      ),
      children: (
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
      )
    }
  ];

  return (
    <ProtectedRoute>
      <div className="profile-page-container">
        <Row gutter={[24, 24]}>
          {/* Профиль пользователя */}
          <Col xs={24} md={6}>
            <div className="profile-sidebar">
              <div className="profile-avatar-section">
                <Avatar 
                  size={120} 
                  src={avatarUrl}
                  icon={!avatarUrl && <UserOutlined />}
                  style={{ marginBottom: '16px' }}
                />
                <Upload
                  name="avatar"
                  showUploadList={false}
                  customRequest={handleAvatarUpload}
                  accept="image/jpeg,image/png,image/gif"
                >
                  <Button 
                    icon={uploading ? <LoadingOutlined /> : <UploadOutlined />} 
                    loading={uploading}
                    className="upload-button"
                    disabled={uploading}
                  >
                    {uploading ? 'Загрузка...' : 'Изменить аватар'}
                  </Button>
                </Upload>
                <div className="username-container" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Title level={4} style={{ marginBottom: '4px', marginRight: '8px' }}>
                    {profile?.username || user?.email?.split('@')[0]}
                  </Title>
                  <Tooltip title="Изменить имя пользователя">
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      size="small"
                      onClick={() => {
                        setNewUsername(profile?.username || '');
                        setUsernameModalVisible(true);
                      }}
                    />
                  </Tooltip>
                </div>
                <Text type="secondary">{user?.email}</Text>
                
                <Divider />
                
                <div className="user-badges">
                  <Title level={5}>Достижения</Title>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    <Tag icon={<TrophyOutlined />} color="gold">Продавец месяца</Tag>
                    <Tag icon={<StarOutlined />} color="blue">Надежный</Tag>
                    <Tag icon={<ShoppingOutlined />} color="green">10+ сделок</Tag>
                  </div>
                </div>
              </div>
            </div>
          </Col>
          
          {/* Основной контент */}
          <Col xs={24} md={18}>
            <Tabs 
              defaultActiveKey="dashboard" 
              items={tabItems} 
              className="profile-tabs"
              style={{ background: 'white', padding: '20px', borderRadius: '8px' }}
            />
          </Col>
        </Row>

        {/* Модальное окно для изменения имени пользователя */}
        <Modal
          title="Изменение имени пользователя"
          open={usernameModalVisible}
          onOk={handleUsernameChange}
          onCancel={() => setUsernameModalVisible(false)}
          confirmLoading={usernameLoading}
          okText="Сохранить"
          cancelText="Отмена"
        >
          <Form layout="vertical">
            <Form.Item 
              label="Новое имя пользователя" 
              rules={[
                { required: true, message: 'Пожалуйста, введите имя пользователя' },
                { min: 3, message: 'Имя пользователя должно содержать минимум 3 символа' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Введите новое имя пользователя"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
} 