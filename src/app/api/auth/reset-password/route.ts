/**
 * 重置密码 - 验证码校验 + 密码更新
 * POST /api/auth/reset-password
 *
 * 请求体:
 * {
 *   "target": "email@example.com" 或 "13812345678",
 *   "code": "123456",
 *   "newPassword": "新密码",
 *   "confirmPassword": "确认新密码"
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { verificationCodeManager } from '@/storage/database/verificationCodeManager';
import { userManager } from '@/storage/database/userManager';
import { hashPassword } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, code, newPassword, confirmPassword } = body;

    // 参数校验
    if (!target || !code || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    // 新密码一致性检查
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: '两次输入的密码不一致' }, { status: 400 });
    }

    // 密码强度校验（至少8位，包含大小写和数字）
    if (newPassword.length < 8) {
      return NextResponse.json({ error: '密码长度至少8位' }, { status: 400 });
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return NextResponse.json({ error: '密码需包含大小写字母和数字' }, { status: 400 });
    }

    // 验证验证码
    const isCodeValid = await verificationCodeManager.verify(target, code, 'reset_password');
    if (!isCodeValid) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    // 查找用户
    let user;
    if (target.includes('@')) {
      user = await userManager.findByEmail(target);
    } else {
      user = await userManager.findByPhone(target);
    }

    if (!user) {
      // 安全考虑：不暴露用户是否存在
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
    }

    // 更新密码
    const hashedPassword = await hashPassword(newPassword);
    await userManager.updateUser(user.id, { password: hashedPassword });

    return NextResponse.json({
      success: true,
      message: '密码重置成功，请使用新密码登录',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '密码重置失败，请稍后重试' }, { status: 500 });
  }
}
