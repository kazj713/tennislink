import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// 日志级别
export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// 操作类型
export enum OperationType {
  AUTH = 'auth',
  PAYMENT = 'payment',
  USER_MANAGEMENT = 'user_management',
  COACH_MANAGEMENT = 'coach_management',
  BOOKING = 'booking',
  COMMUNITY = 'community',
  SYSTEM = 'system',
}

// 安全审计配置
export const AUDIT_CONFIG = {
  // 需要审计的API路径
  AUDIT_PATHS: [
    '/api/auth/**',
    '/api/payment/**',
    '/api/admin/**',
    '/api/bookings/**',
    '/api/coaches/**',
    '/api/community/posts/**',
  ],
  
  // 敏感操作
  SENSITIVE_OPERATIONS: [
    'login',
    'logout',
    'register',
    'create_payment',
    'refund_payment',
    'update_user',
    'delete_user',
    'approve_coach',
    'reject_coach',
  ],
};

/**
 * 安全审计日志接口
 */
export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  operation: OperationType;
  action: string;
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  status: number;
  duration: number;
  details?: any;
  sensitive: boolean;
}

/**
 * 生成唯一日志ID
 */
export function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * 获取用户信息
 */
export async function getUserInfo(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        };
      } catch {
        return null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * 判断是否需要审计
 */
export function shouldAudit(path: string): boolean {
  return AUDIT_CONFIG.AUDIT_PATHS.some(pattern => {
    if (pattern.endsWith('/**')) {
      return path.startsWith(pattern.replace('/**', ''));
    }
    return path === pattern;
  });
}

/**
 * 判断是否是敏感操作
 */
export function isSensitiveOperation(action: string): boolean {
  return AUDIT_CONFIG.SENSITIVE_OPERATIONS.includes(action);
}

/**
 * 获取操作类型
 */
export function getOperationType(path: string): OperationType {
  if (path.startsWith('/api/auth')) {
    return OperationType.AUTH;
  }
  if (path.startsWith('/api/payment')) {
    return OperationType.PAYMENT;
  }
  if (path.startsWith('/api/admin/users')) {
    return OperationType.USER_MANAGEMENT;
  }
  if (path.startsWith('/api/admin/coaches') || path.startsWith('/api/coaches')) {
    return OperationType.COACH_MANAGEMENT;
  }
  if (path.startsWith('/api/bookings')) {
    return OperationType.BOOKING;
  }
  if (path.startsWith('/api/community')) {
    return OperationType.COMMUNITY;
  }
  return OperationType.SYSTEM;
}

/**
 * 获取操作动作
 */
export function getAction(path: string, method: string): string {
  if (path === '/api/auth/login') return 'login';
  if (path === '/api/auth/logout') return 'logout';
  if (path === '/api/auth/register') return 'register';
  if (path === '/api/payment/create') return 'create_payment';
  if (path === '/api/payment/refund') return 'refund_payment';
  if (path === '/api/admin/users' && method === 'POST') return 'create_user';
  if (path === '/api/admin/users' && method === 'PUT') return 'update_user';
  if (path === '/api/admin/users' && method === 'DELETE') return 'delete_user';
  if (path.includes('/coaches') && path.includes('/approve')) return 'approve_coach';
  if (path.includes('/coaches') && path.includes('/reject')) return 'reject_coach';
  if (path.startsWith('/api/bookings') && method === 'POST') return 'create_booking';
  if (path.startsWith('/api/community/posts') && method === 'POST') return 'create_post';
  if (path.startsWith('/api/community/posts') && method === 'DELETE') return 'delete_post';
  return 'unknown';
}

/**
 * 记录安全审计日志
 */
export async function logSecurityEvent(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
  details?: any
) {
  try {
    const path = request.nextUrl.pathname;
    
    // 检查是否需要审计
    if (!shouldAudit(path)) {
      return;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const userInfo = await getUserInfo(request);
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const method = request.method;
    const status = response.status || 200;
    
    const operation = getOperationType(path);
    const action = getAction(path, method);
    const sensitive = isSensitiveOperation(action);
    
    // 构建日志
    const log: SecurityAuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString(),
      level: status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARNING : LogLevel.INFO,
      operation,
      action,
      userId: userInfo?.userId,
      ip,
      userAgent,
      path,
      method,
      status,
      duration,
      details: sensitive ? sanitizeDetails(details) : details,
      sensitive,
    };
    
    // 记录日志（生产环境应存储到数据库或日志系统）
    console.log('SECURITY AUDIT:', JSON.stringify(log));
    
    // 对于敏感操作，记录到单独的敏感日志
    if (sensitive) {
      console.log('SENSITIVE OPERATION:', JSON.stringify(log));
    }
    
    // 对于错误和严重事件，发送告警
    if (log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL) {
      console.error('SECURITY ALERT:', JSON.stringify(log));
      // 这里可以集成告警系统
    }
    
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * 清理敏感信息
 */
export function sanitizeDetails(details: any): any {
  if (!details) return details;
  
  const sanitized = { ...details };
  
  // 移除密码
  if (sanitized.password) {
    sanitized.password = '***';
  }
  
  // 移除令牌
  if (sanitized.token) {
    sanitized.token = '***';
  }
  
  // 移除支付信息
  if (sanitized.cardNumber) {
    sanitized.cardNumber = '***';
  }
  
  if (sanitized.paymentInfo) {
    sanitized.paymentInfo = '***';
  }
  
  return sanitized;
}

/**
 * 安全审计中间件
 */
export async function securityAuditMiddleware(request: NextRequest, next: () => Promise<NextResponse>) {
  const startTime = Date.now();
  
  try {
    // 执行请求
    const response = await next();
    
    // 记录审计日志
    await logSecurityEvent(request, response, startTime);
    
    return response;
  } catch (error: any) {
    // 处理错误
    const errorResponse = NextResponse.json(
      { error: error.message || '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
    
    // 记录错误审计日志
    await logSecurityEvent(request, errorResponse, startTime, { error: error.message });
    
    return errorResponse;
  }
}

/**
 * 批量记录审计日志
 */
export async function batchAuditLogs(logs: SecurityAuditLog[]) {
  // 批量处理日志（生产环境应批量插入数据库）
  logs.forEach(log => {
    console.log('BATCH AUDIT LOG:', JSON.stringify(log));
  });
}

/**
 * 导出审计日志
 */
export async function exportAuditLogs(filters: any): Promise<SecurityAuditLog[]> {
  // 导出日志（生产环境应从数据库查询）
  return [];
}

/**
 * 分析审计日志
 */
export async function analyzeAuditLogs(): Promise<any> {
  // 分析日志（生产环境应进行数据分析）
  return {
    totalLogs: 0,
    totalSensitive: 0,
    totalErrors: 0,
    topSensitiveOperations: [],
    recentSensitiveOperations: [],
  };
}
