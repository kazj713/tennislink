/**
 * 用户登录API
 * 包含速率限制和安全的密码验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateJWTToken, validateEmail, validatePassword } from '@/lib/security';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { getUserByEmail } from '@/storage/database/userManager';



export async function POST(request: NextRequest) {
  // 应用速率限制
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    let user;

    // 统一从数据库查询用户
    user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    if (!user.password) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 生成JWT Token
    const token = generateJWTToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      openid: user.wechatOpenid
    });

    // 返回用户信息和Token
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        openid: user.wechatOpenid,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
        username: user.username
      },
      token
    });

  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}