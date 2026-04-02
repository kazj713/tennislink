import { NextRequest, NextResponse } from 'next/server';
import { venueManager } from '@/storage/database/venueManager';
import { insertVenueBookingSchema } from '@/storage/database/shared/schema';

// POST - 创建场地预约
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertVenueBookingSchema.parse(body);
    
    const booking = await venueManager.createVenueBooking(validatedData);
    
    return NextResponse.json({
      success: true,
      data: booking,
      message: '场地预约成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create venue booking error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '创建场地预约失败' },
      { status: 500 }
    );
  }
}
