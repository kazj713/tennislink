/**
 * 懒加载路由组件
 * 支持代码分割和加载状态
 */

'use client';

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyRouteProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

const defaultFallback = (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600">加载中...</p>
    </div>
  </div>
);

export function LazyRoute({ 
  loader, 
  fallback = defaultFallback, 
  ...props 
}: LazyRouteProps) {
  const LazyComponent = lazy(loader);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * 创建懒加载页面的便捷函数
 */
export function createLazyPage(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode
) {
  return (props: any) => (
    <LazyRoute 
      loader={importFn} 
      fallback={fallback}
      {...props} 
    />
  );
}

/**
 * 预加载组件
 */
export function preloadComponent(importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  importFn();
}