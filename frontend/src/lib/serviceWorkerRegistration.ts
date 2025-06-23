'use client';

import { Workbox } from 'workbox-window';

// Регистрация Service Worker для PWA
export function registerServiceWorker() {
  // Полностью отключаем для устранения проблем с перезагрузками
  console.log('Service Worker registration is disabled temporarily');
  return;
  
  /* Закомментировали оригинальную логику
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        // Если это обновление Service Worker, предложим обновить страницу
        if (confirm('Новая версия доступна! Обновить сейчас?')) {
          window.location.reload();
        }
      }
    });

    wb.addEventListener('activated', (event) => {
      if (event.isUpdate) {
        // Принудительно обновляем страницу после активации нового Service Worker
        window.location.reload();
      }
    });

    // Регистрируем Service Worker
    wb.register();
  }
  */
}

// Проверка состояния сети
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

// Предварительный разогрев и кэширование страниц
export function preWarmCache(urls: string[]) {
  // Отключаем для устранения проблем
  return;
  
  /* Закомментировали оригинальную логику
  if ('caches' in window) {
    const cacheName = 'page-cache-v1';
    
    caches.open(cacheName).then((cache) => {
      urls.forEach((url) => {
        cache.add(url).catch(() => {
          console.warn(`Failed to cache URL: ${url}`);
        });
      });
    });
  }
  */
}

// Инициализация функций Service Worker
export function initServiceWorker() {
  // Отключаем все функционалы для отладки
  console.log('Service Worker initialization is disabled temporarily');
  return;
  
  /* Закомментировали оригинальную логику
  registerServiceWorker();
  
  // Основные страницы для кэширования
  const pagesToCache = [
    '/',
    '/auth',
    '/catalog',
    '/profile'
  ];
  
  // Разогрев кэша
  if (typeof window !== 'undefined' && !isOffline()) {
    // Задержка, чтобы не блокировать загрузку страницы
    setTimeout(() => {
      preWarmCache(pagesToCache);
    }, 3000);
  }
  */
} 