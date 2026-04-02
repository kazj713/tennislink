import { NextRequest, NextResponse } from 'next/server';
import { venueManager } from '@/storage/database/venueManager';

// GET - 获取场地空闲时段
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: '请提供日期' },
        { status: 400 }
      );
    }
    
    const slots = await venueManager.getAvailableSlots(params.id, new Date(date));
    
    return NextResponse.json({
      success: true,
      data: slots
    });
  } catch (error: any) {
    console.error('Get venue slots error:', error);
    return NextResponse.json(
      { error: '获取场地时段失败' },
      { status: 500 }
    );
  }
}
