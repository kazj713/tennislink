/**
 * 预约管理API
 * 处理课程预约的创建和查询
 */
import { NextRequest, NextResponse } from 'next/server';
import { bookingManager } from '@/storage/database/bookingManager';
import { insertBookingSchema } from '@/storage/database/shared/schema';

/**
 * GET /api/bookings
 * 获取预约列表
 * 查询参数:
 *   - userId: 用户ID（可选）
 *   - coachId: 教练ID（可选）
 *   - status: 预约状态（可选）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const coachId = searchParams.get('coachId');
    const status = searchParams.get('status');

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (coachId) filters.coachId = coachId;
    if (status) filters.status = status as any;

    const bookings = await bookingManager.getBookings({ filters });

    return NextResponse.json({
      success: true,
      data: bookings
    });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: '获取预约列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * 创建课程预约
 * 请求体:
 *   - courseId: 课程ID
 *   - userId: 用户ID
 *   - coachId: 教练ID
 *   - scheduledDate: 预约日期
 *   - duration: 课程时长
 *   - notes: 备注（可选）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertBookingSchema.parse(body);

    const booking = await bookingManager.createBooking(validatedData);

    return NextResponse.json({
      success: true,
      data: booking,
      message: '预约创建成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create booking error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '创建预约失败' },
      { status: 500 }
    );
  }
}
