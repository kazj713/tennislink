/**
 * 支付创建API
 * 支持微信支付和支付宝支付
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPayment, PaymentRequest } from '@/lib/payments';
import { getUserByOpenid } from '@/storage/database/userManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, subject, description, paymentMethod, openid } = body;

    // 验证必填参数
    if (!orderId || !amount || !subject || !paymentMethod || !openid) {
      return NextResponse.json(
        { error: '缺少必填参数' },
        { status: 400 }
      );
    }

    // 验证支付方式
    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: '不支持的支付方式' },
        { status: 400 }
      );
    }

    // 验证用户存在
    const user = await getUserByOpenid(openid);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 创建支付请求
    const paymentRequest: PaymentRequest = {
      orderId,
      amount: parseFloat(amount),
      subject,
      description,
      userId: user.id,
      paymentMethod
    };

    // 创建支付
    const result = await createPayment(paymentRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
      qrCode: result.qrCode
    });

  } catch (error) {
    console.error('创建支付失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}