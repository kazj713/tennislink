/**
 * 验证验证码API
 * 用于验证用户输入的验证码是否正确
 */
import { NextRequest, NextResponse } from 'next/server';
import { verificationCodeManager } from '@/storage/database/verificationCodeManager';
type VerificationType = 'register' | 'login' | 'bind_phone' | 'bind_email' | 'reset_password';

/**
 * POST /api/auth/verify-code
 * 验证验证码接口
 * 请求体:
 * {
 *   "target": "email@example.com" 或 "13812345678",
 *   "code": "123456",
 *   "type": "register" | "login" | "bind_phone" | "bind_email" | "reset_password"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, code, type } = body;

    // 验证必填参数
    if (!target) {
      return NextResponse.json(
        { error: '请提供邮箱或手机号' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: '请输入验证码' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: '请指定验证码类型' },
        { status: 400 }
      );
    }

    // 验证验证码
    const verificationCode = await verificationCodeManager.verify(target, code, type);

    if (!verificationCode) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '验证码验证成功'
    });

  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: '验证失败，请稍后重试' },
      { status: 500 }
    );
  }
}
