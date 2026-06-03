/**
 * 忘记密码 - 发送验证码
 * POST /api/auth/forgot-password
 *
 * 请求体:
 * {
 *   "target": "email@example.com" 或 "13812345678"
 * }
 *
 * 响应:
 * { success: true, message: "验证码已发送" }
 * 或
 * { error: "错误信息" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { verificationCodeManager, VerificationCodeManager } from '@/storage/database/verificationCodeManager';

// 邮箱格式验证
const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// 手机号格式验证
const isValidPhone = (phone: string): boolean => /^1[3-9]\d{9}$/.test(phone);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target } = body;

    if (!target) {
      return NextResponse.json({ error: '请输入邮箱或手机号' }, { status: 400 });
    }

    // 验证格式
    if (!isValidEmail(target) && !isValidPhone(target)) {
      return NextResponse.json({ error: '邮箱或手机号格式不正确' }, { status: 400 });
    }

    // 检查频率限制（60秒内不能重复发送）
    const canSend = await verificationCodeManager.canSendCode(target, 'reset_password');
    if (!canSend) {
      return NextResponse.json({ error: '验证码发送过于频繁，请60秒后再试' }, { status: 429 });
    }

    // 生成6位验证码
    const code = VerificationCodeManager.generateCode();
    const expiresAt = VerificationCodeManager.calculateExpiresAt(5); // 5分钟过期

    await verificationCodeManager.create({
      target,
      type: 'reset_password',
      code,
      expiresAt,
    });

    // 发送验证码（复用 send-code 的逻辑）
    // 邮件：使用 @/lib/email 的 sendVerificationCodeEmail
    // 短信：使用阿里云 SMS
    // 如果服务未配置则打印到日志（开发模式友好）

    let sentSuccessfully = false;
    try {
      if (isValidEmail(target)) {
        const { isEmailServiceAvailable, sendVerificationCodeEmail } = await import('@/lib/email');
        if (isEmailServiceAvailable()) {
          await sendVerificationCodeEmail(target, code, 'reset_password');
          sentSuccessfully = true;
        } else {
          console.log(`[忘记密码-邮件] 模拟发送到: ${target}, 验证码: ${code}`);
          sentSuccessfully = true;
        }
      } else {
        // 短信发送逻辑
        if (process.env.ALIYUN_ACCESS_KEY_ID && process.env.ALIYUN_ACCESS_KEY_SECRET) {
          const SMSClient = (await import('@alicloud/sms-sdk')).default;
          const client = new SMSClient({
            accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
            secretAccessKey: process.env.ALIYUN_ACCESS_KEY_SECRET!
          });
          await client.sendSMS({
            PhoneNumbers: target,
            SignName: process.env.ALIYUN_SMS_SIGN_NAME || '网球链接',
            TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789',
            TemplateParam: JSON.stringify({ code })
          });
          sentSuccessfully = true;
        } else {
          console.log(`[忘记密码-短信] 模拟发送到: ${target}, 验证码: ${code}`);
          sentSuccessfully = true;
        }
      }
    } catch (sendError) {
      console.error('发送验证码失败:', sendError);
      // 即使发送失败也返回成功（验证码已存入数据库），避免信息泄露
      sentSuccessfully = true;
    }

    return NextResponse.json({
      success: true,
      message: isValidEmail(target)
        ? '验证码已发送到您的邮箱，请查收'
        : '验证码已发送到您的手机，请注意查收',
      // 开发模式可返回验证码方便调试
      ...(process.env.NODE_ENV === 'development' && process.env.DEBUG_VERIFICATION_CODE === 'true'
        ? { code }
        : {}),
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: '操作失败，请稍后重试' }, { status: 500 });
  }
}
