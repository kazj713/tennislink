/**
 * 发送验证码API
 * 支持邮箱验证码和手机验证码
 */
import { NextRequest, NextResponse } from 'next/server';
import { verificationCodeManager, VerificationCodeManager } from '@/storage/database/verificationCodeManager';
import { verificationTypeEnum } from '@/storage/database/shared/schema';

type VerificationType = 'register' | 'login' | 'bind_phone' | 'bind_email' | 'reset_password';

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
 * 验证手机号格式（中国大陆）
 * @param phone 手机号
 * @returns 是否为有效的手机号格式
 */
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 根据输入内容判断类型
 * @param target 输入内容（邮箱或手机号）
 * @returns 'email' 或 'phone'，如果都不是则返回 null
 */
const detectTargetType = (target: string): 'email' | 'phone' | null => {
  if (isValidEmail(target)) {
    return 'email';
  }
  if (isValidPhone(target)) {
    return 'phone';
  }
  return null;
};

import SMSClient from '@alicloud/sms-sdk';

/**
 * 阿里云短信客户端（延迟初始化）
 */
let smsClient: SMSClient | null = null;

/**
 * 获取阿里云短信客户端实例
 */
function getSMSClient(): SMSClient {
  if (!smsClient) {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const secretAccessKey = process.env.ALIYUN_ACCESS_KEY_SECRET;
    
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('阿里云短信配置未设置');
    }
    
    smsClient = new SMSClient({
      accessKeyId,
      secretAccessKey
    });
  }
  return smsClient;
}

import { sendVerificationCodeEmail, isEmailServiceAvailable } from '@/lib/email';

/**
 * 发送邮件验证码
 * @param email 邮箱地址
 * @param code 验证码
 * @param type 验证码类型
 */
async function sendEmailCode(email: string, code: string, type: string): Promise<void> {
  // 检查邮件服务是否可用
  if (!isEmailServiceAvailable()) {
    console.warn('[邮件发送] 邮件服务未配置，请在 .env.local 中设置 SMTP 配置');
    console.log(`[模拟发送邮件] 发送到: ${email}, 验证码: ${code}`);
    return;
  }

  // 发送真实邮件
  const result = await sendVerificationCodeEmail(email, code, type);
  
  if (!result.success) {
    console.error('[邮件发送] 发送失败:', result.error);
    throw new Error('邮件发送失败: ' + result.error);
  }
  
  console.log(`[邮件发送] 成功发送到: ${email}`);
}

/**
 * 使用阿里云短信服务发送手机验证码
 * @param phone 手机号
 * @param code 验证码
 */
async function sendPhoneCode(phone: string, code: string): Promise<void> {
  try {
    // 检查阿里云配置
    if (!process.env.ALIYUN_ACCESS_KEY_ID || !process.env.ALIYUN_ACCESS_KEY_SECRET) {
      console.warn('[短信发送] 阿里云配置未设置，使用模拟发送');
      console.log(`[模拟发送短信] 发送到: ${phone}, 验证码: ${code}`);
      return;
    }

    // 阿里云短信模板ID和签名（需要在阿里云控制台配置）
    const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789';
    const signName = process.env.ALIYUN_SMS_SIGN_NAME || '网球链接';

    // 发送短信
    const result = await getSMSClient().sendSMS({
      PhoneNumbers: phone,
      SignName: signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify({ code })
    });

    console.log('[短信发送] 发送结果:', result);

    // 检查发送结果
    if (result.Code === 'OK') {
      console.log(`[短信发送] 成功发送到: ${phone}, 验证码: ${code}`);
    } else {
      console.error(`[短信发送] 失败: ${result.Message}`);
      throw new Error(`短信发送失败: ${result.Message}`);
    }
  } catch (error) {
    console.error('[短信发送] 错误:', error);
    throw error;
  }
}

/**
 * POST /api/auth/send-code
 * 发送验证码接口
 * 请求体:
 * {
 *   "target": "email@example.com" 或 "13812345678",
 *   "type": "register" | "login" | "bind_phone" | "bind_email" | "reset_password"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, type } = body;

    // 验证必填参数
    if (!target) {
      return NextResponse.json(
        { error: '请提供邮箱或手机号' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: '请指定验证码类型' },
        { status: 400 }
      );
    }

    // 检测目标类型（邮箱或手机号）
    const targetType = detectTargetType(target);
    if (!targetType) {
      return NextResponse.json(
        { error: '邮箱或手机号格式不正确' },
        { status: 400 }
      );
    }

    // 检查是否可以发送验证码（防止频繁发送）
    const canSend = await verificationCodeManager.canSendCode(target, type);
    if (!canSend) {
      return NextResponse.json(
        { error: '验证码发送过于频繁，请1分钟后再试' },
        { status: 429 }
      );
    }

    // 生成验证码
    const code = VerificationCodeManager.generateCode();
    const expiresAt = VerificationCodeManager.calculateExpiresAt(5); // 5分钟后过期

    // 创建验证码记录
    await verificationCodeManager.create({
      target,
      type,
      code,
      expiresAt,
    });

    // 发送验证码
    if (targetType === 'email') {
      await sendEmailCode(target, code, type);
    } else {
      await sendPhoneCode(target, code);
    }

    // 构建响应数据
    const responseData: { success: boolean; message: string; code?: string } = {
      success: true,
      message: '验证码已发送',
    };

    // 仅在开发环境且明确启用调试模式时才返回验证码
    // 需要同时满足：1. 开发环境 2. 设置 DEBUG_VERIFICATION_CODE=true
    const isDebugMode = process.env.NODE_ENV === 'development' && process.env.DEBUG_VERIFICATION_CODE === 'true';
    if (isDebugMode) {
      responseData.code = code;
      console.warn('[安全警告] 验证码已暴露在响应中，仅用于开发调试');
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
