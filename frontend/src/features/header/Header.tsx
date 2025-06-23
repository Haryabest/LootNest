'use client'

import React from 'react';
import { Layout, Input, Button, Space, Typography, Avatar, Dropdown, Badge } from 'antd';
import { SearchOutlined, MenuOutlined, UserOutlined, LogoutOutlined, SettingOutlined, ShoppingOutlined, HistoryOutlined, PlusOutlined, WalletOutlined, DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';
import Image from 'next/image';

const { Header } = Layout;
const { Title } = Typography;

export default function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Профиль',
      icon: <UserOutlined />,
      onClick: () => router.push('/profile'),
    },
    {
      key: 'settings',
      label: 'Настройки',
      icon: <SettingOutlined />,
      onClick: () => router.push('/settings'),
    },
    {
      key: 'sales-history',
      label: 'История продаж',
      icon: <HistoryOutlined />,
      onClick: () => router.push('/sales-history'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Выйти',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const balanceMenuItems: MenuProps['items'] = [
    {
      key: 'deposit',
      label: 'Пополнение баланса',
      icon: <PlusOutlined />,
      onClick: () => router.push('/profile/deposit'),
    },
    {
      key: 'withdraw',
      label: 'Вывод средств',
      icon: <DownOutlined />,
      onClick: () => router.push('/profile/withdraw'),
    },
  ];

  return (
    <Header className="app-header">
      <div className="header-container">
        <div className="app-header-left">
          <Title level={2} className="app-header-title logo-center">
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', height: '100%' }}>
              <Image 
                src="/logo2.png" 
                alt="LootNest Logo" 
                width={100} 
                height={100} 
                priority={true}
                style={{ objectFit: 'contain' }}
              />
            </Link>
          </Title>
          <Link href="/catalog" passHref>
            <Button
              type="primary"
              icon={<MenuOutlined />}
              className="header-catalog-button"
            >
              Каталог
            </Button>
          </Link>
        </div>
        <div className="app-header-search-container">
          <Input
            placeholder="Поиск"
            className="header-search-input"
            size="large"
            prefix={<SearchOutlined className="search-icon" />}
          />
        </div>
        <Space className="app-header-buttons">
          {user ? (
            <>
              <Link href="/sales-history">
                <Button
                  type="default"
                  icon={<HistoryOutlined />}
                  className="header-history-button"
                >
                  История
                </Button>
              </Link>
              <Link href="/sell">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="header-sell-button"
                >
                  Продать
                </Button>
              </Link>
              
              {/* Баланс пользователя */}
              <Dropdown menu={{ items: balanceMenuItems }} placement="bottomRight">
                <div className="user-balance-dropdown">
                  <Badge>
                    <WalletOutlined style={{ fontSize: '16px', marginRight: '5px' }} />
                    <span className="balance-amount">0,00 ₽</span>
                  </Badge>
                </div>
              </Dropdown>

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="user-profile-dropdown">
                  <Avatar
                    src={profile?.avatar_url}
                    icon={!profile?.avatar_url && <UserOutlined />}
                  />
                  <span className="user-name">{profile?.username || user.email}</span>
                </div>
              </Dropdown>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button type="default">Вход</Button>
              </Link>
              <Link href="/register">
                <Button type="primary">Регистрация</Button>
              </Link>
            </>
          )}
        </Space>
      </div>
    </Header>
  );
} 