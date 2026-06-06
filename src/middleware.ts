/**
 * 安全中间件
 * 处理CORS、安全头、速率限制等
 */

import { NextRequest, NextResponse } from 'next/server';

// 安全配置常量
const SECURITY_CONFIG = {
  // CORS配置 - 从环境变量读取，支持多个域名
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://ydtenhub.online',
        'https://www.ydtenhub.online'
      ],
  CORS_ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],

  // 安全头配置
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
};

/**
 * 检测可疑活动
 */
function detectSuspiciousActivity(req: Request): boolean {
  // 检测常见攻击模式
  const suspiciousPatterns = [
    /union\s+select/i,
    /script\s*>/i,
    /<iframe/i,
    /javascript\s*:/i,
    /on\w+\s*=/i,
    /\.\./,  // 目录遍历
  ];

  const url = req.url || '';
  const userAgent = req.headers.get('user-agent') || '';

  return suspiciousPatterns.some(pattern =>
    pattern.test(url) || pattern.test(userAgent)
  );
}

/**
 * IP白名单检查
 */
function isIPAllowed(ip: string): boolean {
  // 开发环境允许所有IP，生产环境应该配置白名单
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const allowedIPs = (process.env.ALLOWED_IPS || '').split(',').map(s => s.trim());
  return allowedIPs.length === 0 || allowedIPs.includes(ip);
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 获取客户端IP（NextRequest 类型未暴露 ip 属性，通过 headers 获取）
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // 检测可疑活动
  if (detectSuspiciousActivity(request)) {
    console.warn('Suspicious activity detected:', {
      ip,
      url: request.url,
      userAgent: request.headers.get('user-agent')
    });

    return new Response('Forbidden', { status: 403 });
  }

  // IP白名单检查 - 暂时禁用，允许所有IP访问
  // if (!isIPAllowed(ip)) {
  //   console.warn('IP not allowed:', ip);
  //   return new Response('Forbidden', { status: 403 });
  // }

  // 设置安全头
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CORS配置
  const origin = request.headers.get('origin');
  if (SECURITY_CONFIG.CORS_ALLOWED_ORIGINS.includes(origin || '')) {
    response.headers.set('Access-Control-Allow-Origin', origin || '');
  }

  response.headers.set('Access-Control-Allow-Methods',
    SECURITY_CONFIG.CORS_ALLOWED_METHODS.join(', '));

  response.headers.set('Access-Control-Allow-Headers',
    SECURITY_CONFIG.CORS_ALLOWED_HEADERS.join(', '));

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24小时

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // 添加安全日志
  if (process.env.NODE_ENV === 'production') {
    console.log('Request:', {
      method: request.method,
      url: request.url,
      ip,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }

  return response;
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/health (health check)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
