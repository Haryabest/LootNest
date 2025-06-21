'use client'

import React from 'react';
import { Layout, Input, Button, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

export const AppHeader: React.FC = () => {
  return (
    <Header className="app-header">
      <Title level={2} className="app-header-title">
        LootNest
      </Title>
      <div className="app-header-search-container">
        <Input.Search 
          placeholder="Поиск товаров..." 
          className="header-search-input"
          size="large"
          enterButton={
            <Button type="primary" icon={<SearchOutlined />} />
          }
        />
      </div>
      <Space className="app-header-buttons">
        <Button type="default">Вход</Button>
        <Button type="primary">Регистрация</Button>
      </Space>
    </Header>
  );
};

export default AppHeader; 