/**
 * 用户登录API
 * 包含速率限制和安全的密码验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateJWTToken, validateEmail, validatePassword } from '@/lib/security';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { getUserByEmail } from '@/storage/database/userManager';

// 本地开发环境的模拟用户数据
const MOCK_USERS = [
  {
    id: 'admin-001',
    email: 'admin@tennislink.com',
    password: 'admin123456',
    name: '系统管理员',
    role: 'admin',
    phone: '13800000000',
    avatar: null,
    username: 'admin',
    wechatOpenid: null
  },
  {
    id: 'coach-001',
    email: 'coach@tennislink.com',
    password: 'coach123456',
    name: '测试教练',
    role: 'coach',
    phone: '13800000001',
    avatar: null,
    username: 'coach',
    wechatOpenid: null
  },
  {
    id: 'student-001',
    email: 'student@tennislink.com',
    password: 'student123456',
    name: '测试学员',
    role: 'student',
    phone: '13800000002',
    avatar: null,
    username: 'student',
    wechatOpenid: null
  }
];

// 检查是否是本地开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  // 生产环境应用速率限制，开发环境跳过
  if (!isDevelopment) {
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
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

    // 本地开发环境使用模拟数据
    if (isDevelopment) {
      const mockUser = MOCK_USERS.find(u => u.email === email);
      if (mockUser && mockUser.password === password) {
        user = mockUser;
      }
    } else {
      // 生产环境使用数据库
      user = await getUserByEmail(email);
    }

    if (!user) {
      // 为了安全，即使用户不存在也返回相同的错误信息
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 生产环境验证密码
    if (!isDevelopment) {
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