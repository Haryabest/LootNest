'use client';

/**
 * Preloads JavaScript modules for faster subsequent navigation
 * @param paths Array of relative paths to preload
 */
export function preloadModules(paths: string[]) {
  // Временно отключаем для отладки проблем
  console.log('Module preloading disabled');
  return;
  
  /* Закомментируем оригинальную логику
  if (typeof window === 'undefined') return;
  
  // Create a hidden iframe to preload modules without executing them
  const preloadFrameId = 'preload-frame';
  let frame = document.getElementById(preloadFrameId) as HTMLIFrameElement;
  
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = preloadFrameId;
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = 'none';
    frame.style.position = 'absolute';
    frame.style.top = '-9999px';
    frame.style.left = '-9999px';
    document.body.appendChild(frame);
  }
  
  // Preload each path
  paths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = path.endsWith('.js') ? 'script' : 'fetch';
    document.head.appendChild(link);
  });
  */
}

/**
 * Preloads the most commonly accessed routes
 */
export function preloadCommonRoutes() {
  // Временно отключаем для отладки проблем
  console.log('Route preloading disabled');
  return;
  
  /* Закомментируем оригинальную логику
  // List of common routes that should be preloaded
  const commonRoutes = [
    '/auth',
    '/profile',
    '/catalog'
  ];
  
  // Preload route data
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      commonRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 5000); // Wait 5 seconds after page load to start preloading
  }
  */
}

/**
 * Warm up API connections to avoid cold start penalty
 */
export function warmupApiConnections() {
  // Временно отключаем для отладки проблем
  console.log('API warmup disabled');
  return;
  
  /* Закомментируем оригинальную логику
  if (typeof window === 'undefined') return;
  
  // Получаем API URL из переменных окружения
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Выход, если API URL не определен
  if (!apiUrl) return;
  
  // Array of lightweight endpoints to warm up - проверим их существование сначала
  const endpointsToWarmup: string[] = [
    // Пустой массив, пока нет работающих эндпоинтов
  ];
  
  // Delay warmup to not interfere with initial page load
  setTimeout(() => {
    if (endpointsToWarmup.length > 0) {
      endpointsToWarmup.forEach(endpoint => {
        // Используем HEAD запрос вместо GET
        fetch(`${apiUrl}${endpoint}`, { 
          method: 'HEAD',
          mode: 'no-cors' // Не вызывать ошибки CORS
        }).catch(() => {
          // Ignore errors, this is just warmup
        });
      });
    }
  }, 3000);
  */
}

/**
 * Initialize all preloading strategies
 */
export function initPreloading() {
  // Временно отключаем для отладки проблем
  console.log('Preloading initialization disabled');
  return;
  
  /* Закомментируем оригинальную логику
  if (typeof window === 'undefined') return;
  
  // Wait for the browser to be idle
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      preloadCommonRoutes();
      // Отключаем предзагрузку API пока не настроены правильные эндпоинты
      // warmupApiConnections();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadCommonRoutes();
      // Отключаем предзагрузку API пока не настроены правильные эндпоинты
      // warmupApiConnections();
    }, 2000);
  }
  */
}

// Automatically start preloading when this module is imported
// Отключаем авто-запуск
/* Закомментируем оригинальную логику
if (typeof window !== 'undefined') {
  // Wait for page load to complete
  window.addEventListener('load', () => {
    initPreloading();
  });
}
*/ 