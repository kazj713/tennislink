/**
 * 性能监控组件
 * 监控页面加载性能和用户交互
 */

'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // 只在生产环境启用
    if (process.env.NODE_ENV !== 'production') return;

    const measurePerformance = () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        // Core Web Vitals
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        const cls = getCLS();
        const fid = getFID();
        const lcp = getLCP();

        const pageMetrics: PerformanceMetrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: fcp,
          largestContentfulPaint: lcp,
          cumulativeLayoutShift: cls,
          firstInputDelay: fid,
        };

        setMetrics(pageMetrics);
        sendToAnalytics(pageMetrics);
      } catch (error) {
        console.error('Performance measurement failed:', error);
      }
    };

    // 延迟执行以确保所有指标都已收集
    const timer = setTimeout(measurePerformance, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Core Web Vitals helpers
  function getCLS(): number {
    try {
      return (window as any).webVitals?.getCLS?.()?.value || 0;
    } catch {
      return 0;
    }
  }

  function getFID(): number {
    try {
      return (window as any).webVitals?.getFID?.()?.value || 0;
    } catch {
      return 0;
    }
  }

  function getLCP(): number {
    try {
      return (window as any).webVitals?.getLCP?.()?.value || 0;
    } catch {
      return 0;
    }
  }

  function sendToAnalytics(metrics: PerformanceMetrics) {
    // 发送到分析服务
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance',
          metrics,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        console.error('Failed to send performance data:', error);
      });
    }
  }

  return null; // 这个组件不渲染任何UI
}

/**
 * React Hook for monitoring component performance
 */
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.log(`Component ${componentName} render time: ${renderTime.toFixed(2)}ms`);
      
      // 可以发送到分析服务
      if (renderTime > 16) { // 超过一帧的时间
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Performance-aware image loader
 */
export function optimizedImageLoader({ src, width, quality }: any) {
  // 可以集成CDN或图片优化服务
  if (src.startsWith('/images/')) {
    return `${src}?w=${width}&q=${quality || 75}`;
  }
  
  return src;
}