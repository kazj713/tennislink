import { NextRequest, NextResponse } from 'next/server';
import { PaymentServiceFactory, PaymentRequest } from '@/lib/payment';

/**
 * 支付API
 * 支持微信支付、支付宝等多种支付方式
 * 
 * POST /api/payment
 * 请求体:
 * {
 *   "orderId": "订单ID",
 *   "amount": 100, // 金额（元）
 *   "description": "订单描述",
 *   "paymentMethod": "wechat" | "alipay",
 *   "userId": "用户ID",
 *   "returnUrl": "支付完成跳转URL（可选）",
 *   "notifyUrl": "异步通知URL（可选）"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, description, paymentMethod, userId, returnUrl, notifyUrl } = body;

    // 验证必填参数
    if (!orderId || !amount || !paymentMethod || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数：orderId, amount, paymentMethod, userId' },
        { status: 400 }
      );
    }

    // 验证支付方式
    if (!['wechat', 'alipay'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: '不支持的支付方式，支持：wechat, alipay' },
        { status: 400 }
      );
    }

    // 验证金额
    if (amount <= 0) {
      return NextResponse.json(
        { error: '支付金额必须大于0' },
        { status: 400 }
      );
    }

    // 构造支付请求
    const paymentRequest: PaymentRequest = {
      orderId,
      amount,
      description: description || `订单 ${orderId}`,
      paymentMethod: paymentMethod as 'wechat' | 'alipay',
      userId,
      returnUrl,
      notifyUrl,
    };

    // 创建支付服务实例
    const paymentService = PaymentServiceFactory.createPaymentService(paymentMethod as 'wechat' | 'alipay');
    
    // 调用支付服务创建支付
    const paymentResult = await paymentService.createPayment(paymentRequest);

    if (paymentResult.success) {
      return NextResponse.json({
        success: true,
        data: paymentResult.data,
        message: '支付订单创建成功'
      });
    } else {
      return NextResponse.json(
        { error: paymentResult.error || '创建支付订单失败' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: '支付处理失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 查询支付状态
 * GET /api/payment?orderId=xxx&paymentMethod=wechat
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('paymentMethod');

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: '缺少必要参数：orderId, paymentMethod' },
        { status: 400 }
      );
    }

    // 创建支付服务实例
    const paymentService = PaymentServiceFactory.createPaymentService(paymentMethod as 'wechat' | 'alipay');
    
    // 调用支付服务查询支付
    const paymentResult = await paymentService.queryPayment(orderId);

    if (paymentResult.success) {
      return NextResponse.json({
        success: true,
        data: paymentResult.data
      });
    } else {
      return NextResponse.json(
        { error: paymentResult.error || '查询支付状态失败' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Query payment error:', error);
    return NextResponse.json(
      { error: '查询支付状态失败' },
      { status: 500 }
    );
  }
}
