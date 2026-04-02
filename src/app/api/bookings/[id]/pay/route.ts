import { NextRequest, NextResponse } from 'next/server';
import { bookingManager } from '@/storage/database/bookingManager';

// POST - 支付预约
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { transactionId } = body;
    
    if (!transactionId) {
      return NextResponse.json(
        { error: '缺少交易ID' },
        { status: 400 }
      );
    }
    
    const booking = await bookingManager.processPayment(params.id, transactionId);
    
    if (!booking) {
      return NextResponse.json(
        { error: '预约不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: booking,
      message: '支付成功'
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: '支付失败' },
      { status: 500 }
    );
  }
}
