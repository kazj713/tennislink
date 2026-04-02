import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

const JWT_SECRET = env.JWT_SECRET;

// 角色权限配置
export const ROLE_PERMISSIONS = {
  student: {
    canAccess: [
      '/api/coaches', 
      '/api/bookings', 
      '/api/community', 
      '/api/matchups', 
      '/api/venues',
      '/api/notifications',
      '/api/user/profile',
      '/api/auth/me',
    ],
    canWrite: [
      '/api/community', 
      '/api/matchups',
      '/api/user/profile',
      '/api/notifications/mark-read',
    ],
  },
  coach: {
    canAccess: [
      '/api/coaches', 
      '/api/bookings', 
      '/api/community', 
      '/api/courses', 
      '/api/matchups', 
      '/api/venues',
      '/api/notifications',
      '/api/user/profile',
      '/api/auth/me',
    ],
    canWrite: [
      '/api/community', 
      '/api/courses', 
      '/api/matchups',
      '/api/user/profile',
      '/api/notifications/mark-read',
    ],
  },
  admin: {
    canAccess: ['/api/**'],
    canWrite: ['/api/**'],
  },
};

// 权限检查工具函数
export function checkPermission(role: string, path: string, method: string): boolean {
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.student;
  
  // 检查访问权限
  const canAccess = permissions.canAccess.some(pattern => {
    if (pattern.endsWith('/**')) {
      return path.startsWith(pattern.replace('/**', ''));
    }
    return path === pattern;
  });
  
  if (!canAccess) {
    return false;
  }
  
  // 检查写入权限（对于修改操作）
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const canWrite = permissions.canWrite.some(pattern => {
      if (pattern.endsWith('/**')) {
        return path.startsWith(pattern.replace('/**', ''));
      }
      return path === pattern;
    });
    
    if (!canWrite) {
      return false;
    }
  }
  
  return true;
}

// 角色层次结构
export const ROLE_HIERARCHY = {
  student: 1,
  coach: 2,
  admin: 3,
};

// 检查角色是否高于或等于目标角色
export function isRoleHigherOrEqual(userRole: string, targetRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] || 0;
  return userLevel >= targetLevel;
}

/**
 * 验证JWT令牌
 */
export async function validateToken(token: string) {
  try {
    const decoded = verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 认证中间件
 */
export async function authMiddleware(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '未授权，请登录', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const decoded = await validateToken(token);
    if (!decoded) {
      // 清除无效令牌
      cookieStore.delete('token');
      return NextResponse.json(
        { error: '令牌无效或已过期', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    return { success: true, user: decoded };
  } catch (error) {
    return NextResponse.json(
      { error: '认证失败', code: 'AUTH_ERROR' },
      { status: 401 }
    );
  }
}

/**
 * 授权中间件
 */
export async function authorizeMiddleware(request: NextRequest, requiredRole?: string) {
  const authResult = await authMiddleware(request);

  if ('status' in authResult) {
    return authResult;
  }

  const { user } = authResult;
  const userRole = (user as any).role;

  // 检查角色权限
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    return NextResponse.json(
      { error: '权限不足', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  // 检查API访问权限
  const path = request.nextUrl.pathname;
  const permissions = ROLE_PERMISSIONS[userRole as 'student' | 'coach' | 'admin'] || ROLE_PERMISSIONS.student;

  // 检查是否可以访问该API
  const canAccess = permissions.canAccess.some(pattern => {
    if (pattern.endsWith('/**')) {
      return path.startsWith(pattern.replace('/**', ''));
    }
    return path === pattern;
  });

  if (!canAccess) {
    return NextResponse.json(
      { error: '无权访问此资源', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  // 检查是否可以写入（对于POST/PUT/DELETE请求）
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const canWrite = permissions.canWrite.some(pattern => {
      if (pattern.endsWith('/**')) {
        return path.startsWith(pattern.replace('/**', ''));
      }
      return path === pattern;
    });

    if (!canWrite) {
      return NextResponse.json(
        { error: '无权修改此资源', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
  }

  return { success: true, user };
}

/**
 * 管理员权限中间件
 */
export async function adminMiddleware(request: NextRequest) {
  return authorizeMiddleware(request, 'admin');
}

/**
 * 教练权限中间件
 */
export async function coachMiddleware(request: NextRequest) {
  return authorizeMiddleware(request, 'coach');
}
