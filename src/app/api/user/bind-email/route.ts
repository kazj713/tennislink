/**
 * 用户绑定/换绑邮箱API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { userManager } from '@/storage/database/userManager';
import { userModificationLogManager } from '@/storage/database/userModificationLogManager';
import { verificationCodeManager } from '@/storage/database/verificationCodeManager';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否为有效的邮箱格式
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 从Cookie中获取当前用户ID
 * @returns 用户ID或null
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(JWT_SECRET)
    );

    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

/**
 * POST /api/user/bind-email
 * 绑定或换绑邮箱
 * 请求体:
 * {
 *   "email": "new@example.com",
 *   "code": "123456" // 验证码
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await userManager.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, code } = body;

    // 验证邮箱
    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证验证码
    if (!code) {
      return NextResponse.json(
        { error: '请输入验证码' },
        { status: 400 }
      );
    }

    // 验证验证码是否正确
    const isCodeValid = await verificationCodeManager.verify(
      email,
      code,
      'bind_email'
    );

    if (!isCodeValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已被其他用户使用
    const existingUser = await userManager.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: '该邮箱已被其他用户绑定' },
        { status: 400 }
      );
    }

    // 如果是首次绑定，直接绑定
    if (!user.email) {
      await userManager.update(userId, { email });
      
      return NextResponse.json({
        success: true,
        message: '邮箱绑定成功'
      });
    }

    // 如果是换绑，检查本月是否可以修改
    if (user.email && user.email !== email) {
      const canModifyEmail = await userModificationLogManager.canModify(userId, 'email');
      if (!canModifyEmail) {
        return NextResponse.json(
          { error: '每月只能换绑一次邮箱' },
          { status: 429 }
        );
      }

      // 记录修改
      await userModificationLogManager.logModification(
        userId,
        'email',
        user.email,
        email
      );

      // 更新邮箱
      await userManager.update(userId, { email });
    }

    return NextResponse.json({
      success: true,
      message: user.email ? '邮箱换绑成功' : '邮箱绑定成功'
    });

  } catch (error: any) {
    console.error('Bind email error:', error);
    return NextResponse.json(
      { error: '绑定邮箱失败，请稍后重试' },
      { status: 500 }
    );
  }
}
