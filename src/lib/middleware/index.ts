import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, authorizeMiddleware, adminMiddleware, coachMiddleware } from './auth';
import { rateLimitMiddleware } from './rate-limit';
import { generalValidationMiddleware } from './input-validation';
import { securityAuditMiddleware } from './security-audit';

/**
 * 组合多个中间件
 */
export async function withMiddlewares(
  request: NextRequest,
  middlewares: Array<(req: NextRequest, next: () => Promise<NextResponse>) => Promise<any>>,
  next: () => Promise<NextResponse>
) {
  let currentIndex = 0;

  async function executeNext() {
    if (currentIndex >= middlewares.length) {
      return await next();
    }

    const middleware = middlewares[currentIndex];
    currentIndex++;

    const result = await middleware(request, executeNext);

    if (result instanceof NextResponse) {
      return result;
    }

    return await executeNext();
  }

  return executeNext();
}

/**
 * 通用安全中间件
 * 包含：限流、输入验证、安全审计
 */
export async function securityMiddleware(request: NextRequest, next: () => Promise<NextResponse>) {
  // 1. 限流中间件
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  // 2. 输入验证中间件
  const validationResult = await generalValidationMiddleware(request);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  // 3. 安全审计中间件
  return securityAuditMiddleware(request, next);
}

/**
 * 认证安全中间件
 * 包含：认证、限流、输入验证、安全审计
 */
export async function authSecurityMiddleware(request: NextRequest, next: () => Promise<NextResponse>) {
  // 1. 限流中间件（更严格的限流）
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  // 2. 输入验证中间件
  const validationResult = await generalValidationMiddleware(request);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  // 3. 认证中间件
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 4. 安全审计中间件
  return securityAuditMiddleware(request, next);
}

/**
 * 管理员安全中间件
 * 包含：管理员认证、限流、输入验证、安全审计
 */
export async function adminSecurityMiddleware(request: NextRequest, next: () => Promise<NextResponse>) {
  // 1. 限流中间件
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  // 2. 输入验证中间件
  const validationResult = await generalValidationMiddleware(request);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  // 3. 管理员认证中间件
  const adminResult = await adminMiddleware(request);
  if (adminResult instanceof NextResponse) {
    return adminResult;
  }

  // 4. 安全审计中间件
  return securityAuditMiddleware(request, next);
}

/**
 * 教练安全中间件
 * 包含：教练认证、限流、输入验证、安全审计
 */
export async function coachSecurityMiddleware(request: NextRequest, next: () => Promise<NextResponse>) {
  // 1. 限流中间件
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  // 2. 输入验证中间件
  const validationResult = await generalValidationMiddleware(request);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  // 3. 教练认证中间件
  const coachResult = await coachMiddleware(request);
  if (coachResult instanceof NextResponse) {
    return coachResult;
  }

  // 4. 安全审计中间件
  return securityAuditMiddleware(request, next);
}

/**
 * 支付安全中间件
 * 包含：认证、严格限流、输入验证、安全审计
 */
export async function paymentSecurityMiddleware(request: NextRequest, next: () => Promise<NextResponse>) {
  // 1. 严格限流中间件
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  // 2. 输入验证中间件
  const validationResult = await generalValidationMiddleware(request);
  if (validationResult instanceof NextResponse) {
    return validationResult;
  }

  // 3. 认证中间件
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 4. 安全审计中间件
  return securityAuditMiddleware(request, next);
}

/**
 * 获取适合的中间件组合
 */
export function getMiddlewaresForPath(path: string, method: string) {
  const middlewares = [];

  // 所有API都应用基础安全中间件
  if (path.startsWith('/api')) {
    middlewares.push(securityMiddleware);
  }

  // 认证相关API
  if (path.startsWith('/api/auth')) {
    middlewares.push(authSecurityMiddleware);
  }

  // 支付相关API
  if (path.startsWith('/api/payment')) {
    middlewares.push(paymentSecurityMiddleware);
  }

  // 管理员API
  if (path.startsWith('/api/admin')) {
    middlewares.push(adminSecurityMiddleware);
  }

  // 教练相关API
  if (path.startsWith('/api/coaches') && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    middlewares.push(coachSecurityMiddleware);
  }

  return middlewares;
}

/**
 * 主中间件函数
 * 用于Next.js中间件配置
 */
async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // 静态资源跳过
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/images/') ||
    path.startsWith('/icons/')
  ) {
    return NextResponse.next();
  }

  // HTTPS重定向（生产环境）
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto');
    const host = request.headers.get('host');
    
    if (proto === 'http' && host) {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      return NextResponse.redirect(httpsUrl.toString(), 301);
    }
  }

  // 获取适合的中间件
  const middlewares = getMiddlewaresForPath(path, method);

  if (middlewares.length === 0) {
    return NextResponse.next();
  }

  return withMiddlewares(request, middlewares, () => Promise.resolve(NextResponse.next()));
}

export default middleware;
