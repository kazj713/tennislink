/**
 * 资源级权限控制中间件
 * 确保用户只能访问自己的资源
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken } from '@/lib/auth';
import { getDb } from '@/storage/database/instance';
import { bookings, users, coaches, communityPosts, communityComments, notifications } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

/**
 * 验证用户是否有权访问特定资源
 */
export async function verifyResourceAccess(
  request: NextRequest,
  resourceType: 'booking' | 'user' | 'post' | 'comment' | 'notification' | 'coach',
  resourceId: string
): Promise<{ allowed: boolean; userId?: string; error?: string }> {
  try {
    // 获取当前用户
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return { allowed: false, error: '未授权' };
    }

    const payload = await verifyJWTToken(token);
    if (!payload) {
      return { allowed: false, error: '无效的令牌' };
    }

    const currentUserId = payload.userId;
    const userRole = payload.role;

    // 管理员可以访问所有资源
    if (userRole === 'admin') {
      return { allowed: true, userId: currentUserId };
    }

    const db = await getDb();

    // 根据资源类型进行验证
    switch (resourceType) {
      case 'booking': {
        const [booking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, resourceId));
        
        if (!booking) {
          return { allowed: false, error: '预订不存在' };
        }

        // 用户可以访问自己的预订，教练可以访问关联的预订
        if (booking.userId === currentUserId || booking.coachId === currentUserId) {
          return { allowed: true, userId: currentUserId };
        }
        
        return { allowed: false, error: '无权访问此预订' };
      }

      case 'user': {
        // 用户只能访问自己的信息
        if (resourceId === currentUserId) {
          return { allowed: true, userId: currentUserId };
        }
        
        return { allowed: false, error: '无权访问此用户信息' };
      }

      case 'coach': {
        // 教练可以访问自己的资料
        const [coach] = await db
          .select()
          .from(coaches)
          .where(eq(coaches.id, resourceId));
        
        if (!coach) {
          return { allowed: false, error: '教练不存在' };
        }

        if (coach.userId === currentUserId) {
          return { allowed: true, userId: currentUserId };
        }
        
        // 其他用户可以查看教练公开信息
        return { allowed: true, userId: currentUserId };
      }

      case 'post': {
        const [post] = await db
          .select()
          .from(communityPosts)
          .where(eq(communityPosts.id, resourceId));
        
        if (!post) {
          return { allowed: false, error: '帖子不存在' };
        }

        // 用户可以修改自己的帖子
        if (post.userId === currentUserId) {
          return { allowed: true, userId: currentUserId };
        }
        
        // 其他用户可以查看
        if (request.method === 'GET') {
          return { allowed: true, userId: currentUserId };
        }
        
        return { allowed: false, error: '无权修改此帖子' };
      }

      case 'comment': {
        const [comment] = await db
          .select()
          .from(communityComments)
          .where(eq(communityComments.id, resourceId));
        
        if (!comment) {
          return { allowed: false, error: '评论不存在' };
        }

        // 用户可以修改自己的评论
        if (comment.userId === currentUserId) {
          return { allowed: true, userId: currentUserId };
        }
        
        // 其他用户可以查看
        if (request.method === 'GET') {
          return { allowed: true, userId: currentUserId };
        }
        
        return { allowed: false, error: '无权修改此评论' };
      }

      case 'notification': {
        const [notification] = await db
          .select()
          .from(notifications)
          .where(eq(notifications.id, resourceId));
        
        if (!notification) {
          return { allowed: false, error: '通知不存在' };
        }

        // 用户只能访问自己的通知
        if (notification.userId === currentUserId) {
          return { allowed: true, userId: currentUserId };
        }
        
        return { allowed: false, error: '无权访问此通知' };
      }

      default:
        return { allowed: false, error: '未知的资源类型' };
    }
  } catch (error) {
    console.error('资源权限验证失败:', error);
    return { allowed: false, error: '权限验证失败' };
  }
}

/**
 * 资源权限中间件工厂函数
 */
export function createResourceAuthMiddleware(
  resourceType: 'booking' | 'user' | 'post' | 'comment' | 'notification' | 'coach',
  paramName: string = 'id'
) {
  return async function resourceAuthMiddleware(request: NextRequest) {
    // 从URL参数中获取资源ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const resourceId = pathParts[pathParts.length - 1];

    if (!resourceId || resourceId === paramName) {
      return NextResponse.json(
        { error: '缺少资源ID' },
        { status: 400 }
      );
    }

    const result = await verifyResourceAccess(request, resourceType, resourceId);

    if (!result.allowed) {
      return NextResponse.json(
        { error: result.error || '无权访问此资源' },
        { status: 403 }
      );
    }

    // 将用户ID添加到请求头，供后续使用
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', result.userId || '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  };
}

/**
 * 验证用户只能访问自己的数据
 */
export async function verifyOwnership(
  request: NextRequest,
  ownerId: string
): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;

  const payload = await verifyJWTToken(token);
  if (!payload) return false;

  // 管理员可以访问所有数据
  if (payload.role === 'admin') return true;

  // 验证是否是数据所有者
  return payload.userId === ownerId;
}
