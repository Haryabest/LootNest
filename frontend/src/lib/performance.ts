'use client';

// Utility for monitoring and diagnosing performance issues
// Especially for routing and navigation

// Initialize performance monitoring
let routeStartTime = 0;
let isNavigating = false;
const routeTimings: Record<string, number> = {};
const recentRoutes: Array<{route: string, time: number}> = [];
const MAX_RECENT_ROUTES = 10;

// Enable debug mode in development
const DEBUG = process.env.NODE_ENV !== 'production';

/**
 * Start timing a route navigation
 */
export function startRouteTimer(from: string) {
  routeStartTime = performance.now();
  isNavigating = true;
  if (DEBUG) {
    console.log(`🚀 Navigation started from: ${from}`);
  }
}

/**
 * End timing a route navigation
 */
export function endRouteTimer(to: string) {
  if (!isNavigating) return;
  
  const duration = performance.now() - routeStartTime;
  routeTimings[to] = duration;
  isNavigating = false;
  
  // Сохраняем в список недавних навигаций
  recentRoutes.unshift({ route: to, time: duration });
  
  // Ограничиваем список последними 10 маршрутами
  if (recentRoutes.length > MAX_RECENT_ROUTES) {
    recentRoutes.pop();
  }
  
  if (DEBUG) {
    console.log(`✅ Navigation to ${to} took ${duration.toFixed(2)}ms`);
    
    // Alert if navigation takes too long (over 2 seconds)
    if (duration > 2000) {
      console.warn(`⚠️ Slow navigation detected to ${to}: ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Get performance metrics for routes
 */
export function getRouteMetrics() {
  // Рассчитываем среднее время навигации
  const routeTimes = Object.values(routeTimings);
  const avgTime = routeTimes.length 
    ? routeTimes.reduce((acc, time) => acc + time, 0) / routeTimes.length
    : 0;
    
  // Находим самый медленный маршрут
  const slowestRoute = Object.entries(routeTimings)
    .sort((a, b) => b[1] - a[1])
    .shift() || ['none', 0];
    
  return {
    routes: { ...routeTimings },
    averageTime: avgTime,
    slowestRoute: { route: slowestRoute[0], time: slowestRoute[1] },
    recentRoutes: [...recentRoutes],
    systemInfo: runDiagnostics()
  };
}

/**
 * Clear stored route metrics
 */
export function clearRouteMetrics() {
  Object.keys(routeTimings).forEach(key => {
    delete routeTimings[key];
  });
  recentRoutes.length = 0;
}

/**
 * Initialize performance monitoring for the app
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Оптимизируем производительность
  optimizePerformance();
  
  // Monitor page transitions using history API
  const originalPushState = history.pushState;
  history.pushState = function(state, title, url) {
    startRouteTimer(window.location.pathname);
    originalPushState.call(history, state, title, url);
    
    // Set timeout for end in case load event doesn't fire
    setTimeout(() => {
      if (isNavigating) {
        endRouteTimer(url?.toString() || window.location.pathname);
      }
    }, 5000); // Уменьшаем таймаут до 5 секунд
  };
  
  // Monitor page load completion
  window.addEventListener('load', () => {
    if (isNavigating) {
      endRouteTimer(window.location.pathname);
    }
  });
  
  // Отслеживаем окончание загрузки скриптов
  document.addEventListener('DOMContentLoaded', () => {
    if (isNavigating) {
      endRouteTimer(window.location.pathname);
    }
  });
  
  // For single page app route changes
  if (DEBUG) {
    console.log('🔍 Performance monitoring initialized');
  }
}

/**
 * Оптимизирует производительность путем отключения ненужных запросов и функций
 */
export function optimizePerformance() {
  if (typeof window === 'undefined') return;
  
  try {
    // 1. Отключаем API запросы, которые могут блокировать рендеринг
    if (window.localStorage) {
      // Флаг для отключения ненужных API запросов
      window.localStorage.setItem('disable_api_warmup', 'true');
      
      // Отключаем автоматические проверки сессии, если они слишком частые
      if (window.sessionStorage.getItem('last_session_check')) {
        const lastCheck = parseInt(window.sessionStorage.getItem('last_session_check') || '0');
        const now = Date.now();
        
        // Если проверка была менее 10 секунд назад, пропускаем
        if (now - lastCheck < 10000) {
          console.log('💡 Skipping duplicate session check');
          window.sessionStorage.setItem('skip_session_check', 'true');
        }
      }
      
      window.sessionStorage.setItem('last_session_check', Date.now().toString());
    }
    
    // 2. Отложенная загрузка нужных ресурсов
    setTimeout(() => {
      const resources = document.querySelectorAll('link[rel="preload"][as="image"]:not([fetchpriority="high"])');
      resources.forEach(resource => {
        // @ts-ignore
        resource.fetchPriority = "low";
      });
    }, 1000);
    
    // 3. Освобождаем память от неиспользуемых ресурсов
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Если страница скрыта, освобождаем ресурсы
        if (window.gc) {
          // @ts-ignore
          window.gc();
        }
      }
    });
  } catch (e) {
    console.error('Error optimizing performance:', e);
  }
}

// Diagnostic function to check browser capabilities
export function runDiagnostics() {
  if (typeof window === 'undefined') return null;
  
  const diagnostics = {
    // Browser info
    browser: getBrowserInfo(),
    // Network
    connection: (navigator as any).connection?.effectiveType || '4g',
    // Memory
    memoryUsage: getMemoryUsage(),
    // Local Storage
    localStorage: calculateLocalStorageUsage(),
  };
  
  return diagnostics;
}

// Get browser information
function getBrowserInfo() {
  const ua = window.navigator.userAgent;
  let browserName = "Unknown";
  
  if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
  } else if (ua.indexOf("SamsungBrowser") > -1) {
    browserName = "Samsung";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browserName = "Opera";
  } else if (ua.indexOf("Trident") > -1) {
    browserName = "IE";
  } else if (ua.indexOf("Edge") > -1) {
    browserName = "Edge";
  } else if (ua.indexOf("Chrome") > -1) {
    browserName = "Chrome";
  } else if (ua.indexOf("Safari") > -1) {
    browserName = "Safari";
  }
  
  return browserName + "/" + ua.split(/[()]/)[1]?.split(';')[0] || '';
}

// Get memory usage information
function getMemoryUsage() {
  try {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      return `${Math.round(memory.usedJSHeapSize / (1024 * 1024))} MB / ${Math.round(memory.jsHeapSizeLimit / (1024 * 1024))} MB`;
    }
    return 'Not available';
  } catch (e) {
    return 'Not available';
  }
}

// Calculate local storage usage
function calculateLocalStorageUsage() {
  try {
    let total = 0;
    const itemCount = localStorage.length;
    
    for (let i = 0; i < itemCount; i++) {
      const key = localStorage.key(i) || '';
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
    
    return `${itemCount} items ( ${(total / 1024).toFixed(2)} KB)`;
  } catch (e) {
    return '0 items (0 KB)';
  }
}

// Call this function to initialize monitoring
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initPerformanceMonitoring();
  }, 0);
} 