import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

// 内存存储，生产环境建议使用Redis
const rateLimitStore = new Map<string, {
  count: number;
  lastReset: number;
}>();

// 限流配置
export const RATE_LIMIT_CONFIG = {
  // 普通API限流：每个IP每分钟100次请求
  general: {
    windowMs: env.RATE_LIMIT_WINDOW_MS || 60 * 1000, // 1分钟
    max: env.RATE_LIMIT_MAX_REQUESTS || 100, // 最大请求数
  },
  // 认证API限流：每个IP每分钟10次请求
  auth: {
    windowMs: 60 * 1000, // 1分钟
    max: 10, // 最大请求数
  },
  // 支付API限流：每个用户每分钟5次请求
  payment: {
    windowMs: 60 * 1000, // 1分钟
    max: 5, // 最大请求数
  },
  // 验证码API限流：每个IP每分钟3次请求
  verification: {
    windowMs: 60 * 1000, // 1分钟
    max: 3, // 最大请求数
  },
};

/**
 * 获取请求的唯一标识符
 * @param request 请求对象
 * @returns 唯一标识符（IP或用户ID）
 */
export function getRequestIdentifier(request: NextRequest): string {
  // 使用IP地址
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';
  return `ip:${ip}`;
}

/**
 * 获取API的限流配置
 * @param path API路径
 * @returns 限流配置
 */
export function getRateLimitConfig(path: string) {
  if (path.startsWith('/api/payment')) {
    return RATE_LIMIT_CONFIG.payment;
  }
  if (path.startsWith('/api/auth/send-code') || path.startsWith('/api/auth/verify-code')) {
    return RATE_LIMIT_CONFIG.verification;
  }
  if (path.startsWith('/api/auth')) {
    return RATE_LIMIT_CONFIG.auth;
  }
  return RATE_LIMIT_CONFIG.general;
}

/**
 * 检查是否超过限流
 * @param key 唯一标识符
 * @param config 限流配置
 * @returns 是否允许请求
 */
export function checkRateLimit(key: string, config: typeof RATE_LIMIT_CONFIG.general) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // 首次请求
    rateLimitStore.set(key, {
      count: 1,
      lastReset: now,
    });
    return { allowed: true, remaining: config.max - 1 };
  }

  // 检查是否需要重置计数
  if (now - entry.lastReset > config.windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      lastReset: now,
    });
    return { allowed: true, remaining: config.max - 1 };
  }

  // 检查是否超过限制
  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0 };
  }

  // 更新计数
  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: config.max - entry.count };
}

/**
 * API限流中间件
 */
export async function rateLimitMiddleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    
    // 跳过静态资源
    if (!path.startsWith('/api')) {
      return { allowed: true };
    }

    const identifier = getRequestIdentifier(request);
    const config = getRateLimitConfig(path);
    const result = checkRateLimit(identifier, config);

    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: '请求过于频繁，请稍后再试', 
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // 添加限流响应头
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.max.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil((Date.now() + config.windowMs) / 1000).toString());

    return { allowed: true, response };
  } catch (error) {
    // 限流检查失败时，允许请求通过
    return { allowed: true };
  }
}

/**
 * 清理过期的限流数据
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // 清理超过10分钟的记录
    if (now - entry.lastReset > 10 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

// 每5分钟清理一次过期数据
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
