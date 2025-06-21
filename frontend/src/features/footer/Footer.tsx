'use client'

import React from 'react';
import { Layout, Row, Col, Typography, Space, Button, Divider } from 'antd';

const { Footer } = Layout;
const { Title, Text, Link } = Typography;

export const AppFooter: React.FC = () => {
  return (
    <Footer className="app-footer">
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={8} lg={8}>
          <Title level={3} className="app-footer-title">
            LootNest
          </Title>
          <Text className="app-footer-text">
            Ваш надежный маркетплейс для покупки и продажи игровых предметов
          </Text>
          <Space>
            <Button type="primary" ghost>О нас</Button>
            <Button type="primary" ghost>Контакты</Button>
          </Space>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={8}>
          <Title level={4} className="app-footer-title">
            Категории
          </Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Link className="app-footer-link">Игровые аккаунты</Link>
            <Link className="app-footer-link">Внутриигровые предметы</Link>
            <Link className="app-footer-link">Валюта</Link>
            <Link className="app-footer-link">Скины</Link>
            <Link className="app-footer-link">Услуги</Link>
          </Space>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={8}>
          <Title level={4} className="app-footer-title">
            Поддержка
          </Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Link className="app-footer-link">Центр поддержки</Link>
            <Link className="app-footer-link">Безопасные сделки</Link>
            <Link className="app-footer-link">Правила сервиса</Link>
            <Link className="app-footer-link">FAQ</Link>
          </Space>
        </Col>
      </Row>
      
      <Divider className="app-footer-divider" />
      
      <Row justify="space-between" align="middle">
        <Col>
          <Text className="app-footer-text">
            © 2023 LootNest. Все права защищены.
          </Text>
        </Col>
        <Col>
          <Space>
            <Link className="app-footer-link">Условия использования</Link>
            <Link className="app-footer-link">Политика конфиденциальности</Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default AppFooter; 