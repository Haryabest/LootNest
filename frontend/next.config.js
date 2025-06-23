/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false, // Отключаем строгий режим для улучшения производительности
  // swcMinify: true, // Удаляем для избежания предупреждения, теперь это включено по умолчанию
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Сохраняем важные логи
    } : false,
  },
  images: {
    domains: [process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '')].filter(Boolean),
    minimumCacheTTL: 1800,
  },
  experimental: {
    // Используем только поддерживаемые экспериментальные функции
    turbotrace: {
      logLevel: 'silent',
    },
  },
  // Устанавливаем правильный devtool для webpack
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Используем 'eval' для более быстрой компиляции в режиме разработки
      config.devtool = 'cheap-module-source-map';
    }
    
    // Оптимизация модулей
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };
    
    return config;
  },
  // Уменьшаем объем кода
  compress: true,
  // Отключаем preflight проверки
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Добавляем анализатор бандлов в режиме разработки
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Экспортируем конфигурацию без PWA
module.exports = withBundleAnalyzer(nextConfig); 