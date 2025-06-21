'use client'

import '../styles'; // Import all styles
import Header from '../features/header/Header';
import AppFooter from '../features/footer/Footer';
import { ConfigProvider, Layout, App } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';

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
          <App>
            <AuthProvider>
              <Layout className="app-layout">
                <Header />
                <Content className="app-content">
                  {children}
                </Content>
                <AppFooter />
              </Layout>
            </AuthProvider>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
