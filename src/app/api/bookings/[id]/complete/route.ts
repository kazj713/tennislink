import { NextRequest, NextResponse } from 'next/server';
import { bookingManager } from '@/storage/database/bookingManager';

// POST - 完成课程
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const booking = await bookingManager.completeBooking(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: '预约不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: booking,
      message: '课程已完成'
    });
  } catch (error: any) {
    console.error('Complete booking error:', error);
    return NextResponse.json(
      { error: '完成课程失败' },
      { status: 500 }
    );
  }
}
