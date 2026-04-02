import { NextRequest, NextResponse } from 'next/server';
import { PaymentServiceFactory } from '@/lib/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求参数
    if (!body.transactionId || !body.amount || !body.reason || !body.paymentMethod) {
      return NextResponse.json(
        { error: '缺少必要的请求参数' },
        { status: 400 }
      );
    }
    
    // 创建支付服务实例
    const paymentService = PaymentServiceFactory.createPaymentService(body.paymentMethod);
    
    // 调用支付服务创建退款
    const refundResult = await paymentService.refundPayment(
      body.transactionId,
      body.amount,
      body.reason
    );
    
    return NextResponse.json(refundResult);
  } catch (error: any) {
    console.error('Refund payment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '退款失败',
        message: '退款失败' 
      },
      { status: 500 }
    );
  }
}
