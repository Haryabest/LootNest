'use client'

import '../styles'; // Import all styles
import { AppHeader } from '../features/header/Header';
import { AppFooter } from '../features/footer/Footer';
import { ConfigProvider, Layout } from 'antd';
import { theme } from 'antd';

const { Content } = Layout;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: 'Segoe UI, sans-serif',
            },
          }}
        >
          <Layout className="app-layout">
            <AppHeader />
            <Content className="app-content">
              {children}
            </Content>
            <AppFooter />
          </Layout>
        </ConfigProvider>
      </body>
    </html>
  );
}
