import { NextRequest, NextResponse } from 'next/server';
import { PaymentServiceFactory } from '@/lib/payment';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId') || searchParams.get('transactionId');
    const paymentMethod = searchParams.get('paymentMethod');
    
    // 验证请求参数
    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: '缺少必要的请求参数：orderId/transactionId, paymentMethod' },
        { status: 400 }
      );
    }
    
    // 创建支付服务实例
    const paymentService = PaymentServiceFactory.createPaymentService(paymentMethod as any);
    
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
