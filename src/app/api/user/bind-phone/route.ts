/**
 * 用户绑定/换绑手机号API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { userManager } from '@/storage/database/userManager';
import { userModificationLogManager } from '@/storage/database/userModificationLogManager';
import { verificationCodeManager } from '@/storage/database/verificationCodeManager';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 验证手机号格式
 * @param phone 手机号
 * @returns 是否为有效的手机号格式
 */
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
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
 * POST /api/user/bind-phone
 * 绑定或换绑手机号
 * 请求体:
 * {
 *   "phone": "13812345678",
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
    const { phone, code } = body;

    // 验证手机号
    if (!phone) {
      return NextResponse.json(
        { error: '请提供手机号' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: '手机号格式不正确' },
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
      phone,
      code,
      'bind_phone'
    );

    if (!isCodeValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 检查手机号是否已被其他用户使用
    const existingUser = await userManager.findByPhone(phone);
    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: '该手机号已被其他用户绑定' },
        { status: 400 }
      );
    }

    // 如果是首次绑定，直接绑定
    if (!user.phone) {
      await userManager.update(userId, { phone });
      
      return NextResponse.json({
        success: true,
        message: '手机号绑定成功'
      });
    }

    // 如果是换绑，检查本月是否可以修改
    if (user.phone && user.phone !== phone) {
      const canModifyPhone = await userModificationLogManager.canModify(userId, 'phone');
      if (!canModifyPhone) {
        return NextResponse.json(
          { error: '每月只能换绑一次手机号' },
          { status: 429 }
        );
      }

      // 记录修改
      await userModificationLogManager.logModification(
        userId,
        'phone',
        user.phone,
        phone
      );

      // 更新手机号
      await userManager.update(userId, { phone });
    }

    return NextResponse.json({
      success: true,
      message: user.phone ? '手机号换绑成功' : '手机号绑定成功'
    });

  } catch (error: any) {
    console.error('Bind phone error:', error);
    return NextResponse.json(
      { error: '绑定手机号失败，请稍后重试' },
      { status: 500 }
    );
  }
}
