/**
 * 邮件服务模块
 * 支持多种邮件服务提供商（SMTP、SendGrid、阿里云邮件等）
 */

import nodemailer from 'nodemailer';
import { systemSettingsManager } from '@/storage/database/systemSettingsManager';

// 邮件配置接口
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  fromName: string;
}

// 默认邮件配置（从环境变量读取）
const getDefaultEmailConfig = (): EmailConfig | null => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const fromName = process.env.SMTP_FROM_NAME || 'Tennis Link';

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from: from || user,
    fromName,
  };
};

// 创建邮件传输器
const createTransporter = (config: EmailConfig) => {
  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    pool: true, // 使用连接池
    maxConnections: 5,
    maxMessages: 100,
  });
};

// 验证邮件配置
export const verifyEmailConfig = async (config: EmailConfig): Promise<boolean> => {
  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('邮件配置验证失败:', error);
    return false;
  }
};

// 发送邮件接口
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * 发送邮件
 * @param options 邮件选项
 * @returns 发送结果
 */
export const sendEmail = async (options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // 获取邮件配置
    const config = getDefaultEmailConfig();
    
    if (!config) {
      console.warn('[邮件服务] 邮件配置未设置，跳过发送');
      return { success: false, error: '邮件配置未设置' };
    }

    // 创建传输器
    const transporter = createTransporter(config);

    // 发送邮件
    const result = await transporter.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    });

    console.log(`[邮件服务] 邮件发送成功: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('[邮件服务] 邮件发送失败:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * 发送验证码邮件
 * @param email 收件人邮箱
 * @param code 验证码
 * @param type 验证码类型
 */
export const sendVerificationCodeEmail = async (
  email: string,
  code: string,
  type: string
): Promise<{ success: boolean; error?: string }> => {
  const typeNames: Record<string, string> = {
    register: '注册',
    login: '登录',
    bind_email: '绑定邮箱',
    reset_password: '重置密码',
  };

  const typeName = typeNames[type] || '验证';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>验证码</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #16a34a;
        }
        .title {
          font-size: 20px;
          color: #333333;
          margin-bottom: 20px;
        }
        .code-container {
          background-color: #f0fdf4;
          border: 2px dashed #16a34a;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          color: #16a34a;
          letter-spacing: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          text-align: center;
          color: #666666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎾 Tennis Link</div>
        </div>
        <div class="title">您的${typeName}验证码</div>
        <p>您好！</p>
        <p>您正在进行${typeName}操作，请输入以下验证码完成验证：</p>
        <div class="code-container">
          <div class="code">${code}</div>
        </div>
        <p>验证码有效期为 5 分钟，请勿泄露给他人。</p>
        <p>如非本人操作，请忽略此邮件。</p>
        <div class="footer">
          <p>此邮件由 Tennis Link 自动发送，请勿回复</p>
          <p>© 2024 Tennis Link. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Tennis Link 验证码
    
    您的${typeName}验证码是：${code}
    
    验证码有效期为 5 分钟，请勿泄露给他人。
    
    如非本人操作，请忽略此邮件。
    
    © 2024 Tennis Link
  `;

  const result = await sendEmail({
    to: email,
    subject: `【Tennis Link】${typeName}验证码`,
    text,
    html,
  });

  return {
    success: result.success,
    error: result.error,
  };
};

/**
 * 发送支付成功邮件
 * @param email 收件人邮箱
 * @param orderInfo 订单信息
 */
export const sendPaymentSuccessEmail = async (
  email: string,
  orderInfo: {
    orderNo: string;
    amount: string;
    type: string;
    createdAt: Date;
  }
): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .success-icon { font-size: 48px; color: #16a34a; }
        .title { font-size: 24px; color: #333; margin: 20px 0; }
        .order-info { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-info p { margin: 10px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✓</div>
          <div class="title">支付成功</div>
        </div>
        <p>您好！</p>
        <p>您的订单已成功支付，以下是订单详情：</p>
        <div class="order-info">
          <p><strong>订单编号：</strong>${orderInfo.orderNo}</p>
          <p><strong>支付金额：</strong>¥${orderInfo.amount}</p>
          <p><strong>订单类型：</strong>${orderInfo.type}</p>
          <p><strong>支付时间：</strong>${orderInfo.createdAt.toLocaleString('zh-CN')}</p>
        </div>
        <p>感谢您的使用！如有问题请联系客服。</p>
        <div class="footer">
          <p>© 2024 Tennis Link</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: '【Tennis Link】支付成功通知',
    html,
  });

  return {
    success: result.success,
    error: result.error,
  };
};

/**
 * 发送预约提醒邮件
 * @param email 收件人邮箱
 * @param bookingInfo 预约信息
 */
export const sendBookingReminderEmail = async (
  email: string,
  bookingInfo: {
    coachName: string;
    date: string;
    time: string;
    venue?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; color: #333; margin: 20px 0; }
        .booking-info { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">⏰ 预约提醒</div>
        </div>
        <p>您好！</p>
        <p>您有一个即将开始的网球课程预约：</p>
        <div class="booking-info">
          <p><strong>教练：</strong>${bookingInfo.coachName}</p>
          <p><strong>日期：</strong>${bookingInfo.date}</p>
          <p><strong>时间：</strong>${bookingInfo.time}</p>
          ${bookingInfo.venue ? `<p><strong>场地：</strong>${bookingInfo.venue}</p>` : ''}
        </div>
        <p>请准时参加，如有变动请提前联系教练。</p>
        <div class="footer">
          <p>© 2024 Tennis Link</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: email,
    subject: '【Tennis Link】预约提醒',
    html,
  });

  return {
    success: result.success,
    error: result.error,
  };
};

// 检查邮件服务是否可用
export const isEmailServiceAvailable = (): boolean => {
  return !!getDefaultEmailConfig();
};
