'use client'

import '../styles'; // Import all styles
// import './globals.css'; // Удаляем этот импорт, который вызывает ошибку
import '@/styles/components.css';
import '@/styles/layout.css';
import dynamic from 'next/dynamic';
import { ConfigProvider, Layout, App, Spin } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import { Suspense, lazy, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPerformanceMonitoring, startRouteTimer, endRouteTimer } from '@/lib/performance';
import { initPreloading, preloadCommonRoutes } from '@/lib/preload';
import { initServiceWorker } from '@/lib/serviceWorkerRegistration';
import { Inter } from 'next/font/google';

const { Content } = Layout;

// Initialize web fonts
const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  preload: true,
});

// Оптимизированная загрузка компонентов
const Header = dynamic(() => import('../features/header/Header'), {
  loading: () => <div className="header-placeholder" style={{ height: '64px', width: '100%' }} />,
  ssr: false // Отключаем серверный рендеринг для этого компонента
});

const AppFooter = dynamic(() => import('../features/footer/Footer'), {
  loading: () => <div className="footer-placeholder" style={{ height: '64px', width: '100%' }} />,
  ssr: false // Отключаем серверный рендеринг для этого компонента
});

// Компонент для загрузки
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <Spin size="large" />
  </div>
);

// Оптимизированный компонент для трекинга производительности
function PerformanceWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Завершаем предыдущую навигацию и начинаем отслеживать новую
      endRouteTimer(pathname);
      startRouteTimer(pathname);
      
      // Более короткий таймаут для маркировки загрузки маршрута
      const timeoutId = setTimeout(() => {
        endRouteTimer(pathname);
      }, 500);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [pathname]);
  
  return <>{children}</>;
}

// Примечание: metadata не будет работать в клиентском компоненте ('use client'),
// поэтому метаданные определяем в Head внутри возвращаемого JSX

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Эффект для инициализации систем мониторинга и предзагрузки
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Инициализация без блокировки основного потока
      const timer = setTimeout(() => {
        initPerformanceMonitoring();
        initPreloading();
        initServiceWorker(); // Инициализируем Service Worker
      }, 100);
      
      // Предзагрузка общих маршрутов при взаимодействии
      const handleNavigation = () => {
        preloadCommonRoutes();
      };
      
      window.addEventListener('mousedown', handleNavigation);
      window.addEventListener('touchstart', handleNavigation);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('mousedown', handleNavigation);
        window.removeEventListener('touchstart', handleNavigation);
      };
    }
  }, []);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <html lang="ru" className={inter.className}>
      <head>
        {/* Метаданные для PWA */}
        <title>LootNest - Торговая площадка игровых предметов</title>
        <meta name="description" content="Безопасная площадка для покупки и продажи игровых предметов" />
        <meta name="application-name" content="LootNest" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* DNS prefetching */}
        {supabaseUrl && <link rel="dns-prefetch" href={supabaseUrl} />}
        {apiUrl && <link rel="dns-prefetch" href={apiUrl} />}
        
        {/* Preload critical assets */}
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
        <link rel="preload" href="/logo.png" as="image" fetchPriority="high" />
        
        {/* PWA манифест и метатеги */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="LootNest" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#000000" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
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
                {/* Рендеринг хедера после основного контента */}
                <Suspense fallback={<div className="header-placeholder" style={{ height: '64px' }} />}>
                  <Header />
                </Suspense>
                
                <Content className="app-content">
                  <Suspense fallback={<LoadingFallback />}>
                    <PerformanceWrapper>
                      {children}
                    </PerformanceWrapper>
                  </Suspense>
                </Content>
                
                {/* Футер можно загрузить с задержкой */}
                <Suspense fallback={<div className="footer-placeholder" style={{ height: '64px' }} />}>
                  <AppFooter />
                </Suspense>
              </Layout>
            </AuthProvider>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
