/**
 * 速率限制中间件
 * 防止API滥用和DDoS攻击
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// 内存存储（生产环境应使用Redis等）
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  message?: string; // 限制时的错误消息
  skipSuccessfulRequests?: boolean; // 跳过成功的请求
  skipFailedRequests?: boolean; // 跳过失败的请求
}

/**
 * 默认的速率限制配置
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100, // 100次请求
  message: '请求过于频繁，请稍后再试',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * 特定端点的速率限制配置
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5, // 5次登录尝试
    message: '登录尝试过于频繁，请15分钟后再试',
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1小时
    maxRequests: 3, // 3次注册尝试
    message: '注册尝试过于频繁，请1小时后再试',
  },
  '/api/payments/create': {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10, // 10次支付创建
    message: '支付请求过于频繁，请稍后再试',
  },
  '/api/upload': {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 20, // 20次上传
    message: '上传请求过于频繁，请稍后再试',
  },
};

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string {
  return request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
}

/**
 * 清理过期的速率限制记录
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 速率限制中间件
 */
export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  const limitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  
  return function rateLimit(request: NextRequest): NextResponse | null {
    const ip = getClientIP(request);
    const key = `${request.nextUrl.pathname}:${ip}`;
    const now = Date.now();
    
    // 清理过期记录
    cleanupExpiredRecords();
    
    // 获取当前记录
    let record = rateLimitStore.get(key);
    
    if (!record) {
      // 创建新记录
      record = {
        count: 1,
        resetTime: now + limitConfig.windowMs
      };
      rateLimitStore.set(key, record);
      return null; // 允许请求
    }
    
    // 检查是否已过期
    if (now > record.resetTime) {
      // 重置记录
      record.count = 1;
      record.resetTime = now + limitConfig.windowMs;
      return null; // 允许请求
    }
    
    // 增加计数
    record.count++;
    
    // 检查是否超过限制
    if (record.count > limitConfig.maxRequests) {
      return NextResponse.json(
        { 
          error: limitConfig.message || '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
            'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
          }
        }
      );
    }
    
    // 请求通过速率限制，返回 null 让请求继续处理
    // 注意：在 App Router 中不能返回 NextResponse.next()
    return null;
  };
}

/**
 * 路由特定的速率限制中间件
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const config = RATE_LIMIT_CONFIGS[pathname];
  
  if (config) {
    return createRateLimitMiddleware(config)(request);
  }
  
  // 使用默认配置
  return createRateLimitMiddleware()(request);
}