/**
 * 注册API
 * 支持使用手机号或邮箱注册，需要验证码验证
 */
import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { hash } from 'bcryptjs';
import { verificationCodeManager } from '@/storage/database/verificationCodeManager';

// 验证邮箱格式
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证手机号格式（中国大陆手机号）
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * POST /api/auth/register
 * 注册接口
 * 请求体:
 * {
 *   "email": "email@example.com" 或 "phone": "13812345678",
 *   "name": "用户名",
 *   "password": "密码",
 *   "code": "验证码",
 *   "role": "student" | "coach"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, code, role } = body;

    // 验证必填参数
    if (!name) {
      return NextResponse.json(
        { error: '请输入用户名' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: '请输入密码' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: '请输入验证码' },
        { status: 400 }
      );
    }

    // 验证至少提供了邮箱或手机号
    if (!email && !phone) {
      return NextResponse.json(
        { error: '请提供邮箱或手机号' },
        { status: 400 }
      );
    }

    // 验证用户名长度
    if (name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: '用户名长度应为2-20位' },
        { status: 400 }
      );
    }

    // 验证邮箱格式（如果提供了）
    let target = '';
    if (email) {
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: '邮箱格式不正确' },
          { status: 400 }
        );
      }
      
      // 检查邮箱是否已存在
      const existingEmail = await userManager.findByEmail(email);
      if (existingEmail) {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 400 }
        );
      }
      
      target = email;
    }

    // 验证手机号格式（如果提供了）
    if (phone) {
      if (!isValidPhone(phone)) {
        return NextResponse.json(
          { error: '手机号格式不正确' },
          { status: 400 }
        );
      }

      // 检查手机号是否已存在
      const existingPhone = await userManager.findByPhone(phone);
      if (existingPhone) {
        return NextResponse.json(
          { error: '该手机号已被注册' },
          { status: 400 }
        );
      }
      
      target = phone;
    }

    // 如果邮箱和手机号都提供了，优先使用邮箱验证
    if (email && phone) {
      target = email;
    }

    // 验证验证码
    const isCodeValid = await verificationCodeManager.verify(target, code, 'register');
    if (!isCodeValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 密码加密
    const hashedPassword = await hash(password, 10);

    // 创建用户数据
    const userData = {
      name,
      email: email || null,
      phone: phone || null,
      password: hashedPassword,
      role: role || 'student',
    };

    // 创建用户
    const user = await userManager.create(userData);

    // 如果是教练角色，自动创建教练档案
    if (role === 'coach') {
      // 引入coachManager，避免循环依赖
      const { coachManager } = await import('@/storage/database/coachManager');
      await coachManager.create({
        userId: user.id,
        status: 'pending',
        experienceYears: 0,
        certifications: [],
        specialties: [],
        teachingStyle: '',
        teachingAreas: [],
        hourlyRate: '0.00',
        availableDays: [],
        availableTimeSlots: [],
        bankInfo: {},
      });
    }

    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: '注册成功'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Register error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '请求数据格式错误', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
