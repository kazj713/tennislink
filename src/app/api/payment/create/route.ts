import { NextRequest, NextResponse } from 'next/server';
import { PaymentServiceFactory, PaymentRequest } from '@/lib/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求参数
    if (!body.amount || !body.orderId || !body.description || !body.paymentMethod || !body.userId) {
      return NextResponse.json(
        { error: '缺少必要的请求参数：amount, orderId, description, paymentMethod, userId' },
        { status: 400 }
      );
    }
    
    // 检查是否是VIP会员相关的支付
    const description = body.description.toLowerCase();
    if (description.includes('vip') || description.includes('会员') || description.includes('会员')) {
      return NextResponse.json(
        { error: 'VIP会员功能暂时未开放' },
        { status: 403 }
      );
    }
    
    const paymentRequest: PaymentRequest = {
      amount: body.amount,
      orderId: body.orderId,
      description: body.description,
      paymentMethod: body.paymentMethod,
      userId: body.userId,
      returnUrl: body.returnUrl,
      notifyUrl: body.notifyUrl
    };
    
    // 创建支付服务实例
    const paymentService = PaymentServiceFactory.createPaymentService(body.paymentMethod);
    
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
    console.error('Create payment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '支付创建失败',
        message: '支付创建失败' 
      },
      { status: 500 }
    );
  }
}
