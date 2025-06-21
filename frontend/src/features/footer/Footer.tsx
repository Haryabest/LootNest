'use client'

import React from 'react';
import { Layout, Row, Col, Typography, Divider } from 'antd';
import NextLink from 'next/link';
import ApiModeToggle from '@/components/auth/ApiModeToggle';

const { Footer } = Layout;
const { Title, Text } = Typography;

export default function AppFooter() {
  return (
    <Footer className="app-footer">
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Title level={5} className="app-footer-title">LootNest</Title>
          <Text className="app-footer-text">
            Маркетплейс игрового контента и цифровых товаров
          </Text>
          <ApiModeToggle />
        </Col>
        <Col xs={24} sm={8}>
          <Title level={5} className="app-footer-title">Информация</Title>
          <NextLink href="/about" className="app-footer-link">
            <Text className="app-footer-text">О нас</Text>
          </NextLink>
          <NextLink href="/terms" className="app-footer-link">
            <Text className="app-footer-text">Условия использования</Text>
          </NextLink>
          <NextLink href="/privacy" className="app-footer-link">
            <Text className="app-footer-text">Политика конфиденциальности</Text>
          </NextLink>
        </Col>
        <Col xs={24} sm={8}>
          <Title level={5} className="app-footer-title">Поддержка</Title>
          <NextLink href="/faq" className="app-footer-link">
            <Text className="app-footer-text">FAQ</Text>
          </NextLink>
          <NextLink href="/contact" className="app-footer-link">
            <Text className="app-footer-text">Связаться с нами</Text>
          </NextLink>
        </Col>
      </Row>
      <Divider className="app-footer-divider" />
      <Text className="app-footer-text" style={{ textAlign: 'center' }}>
        © {new Date().getFullYear()} LootNest. Все права защищены.
      </Text>
    </Footer>
  );
} 