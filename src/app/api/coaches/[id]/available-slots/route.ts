import { NextRequest, NextResponse } from 'next/server';
import { coachManager } from '@/storage/database/coachManager';
import { bookingManager } from '@/storage/database/bookingManager';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const coachId = params.id;
    
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: '缺少日期参数' },
        { status: 400 }
      );
    }
    
    // 获取教练信息
    const coach = await coachManager.getCoachById(coachId);
    if (!coach) {
      return NextResponse.json(
        { error: '教练不存在' },
        { status: 404 }
      );
    }
    
    // 获取教练的可用时间段
    const availableDays = Array.isArray(coach.availableDays) ? coach.availableDays : [];
    const availableTimeSlots = Array.isArray(coach.availableTimeSlots) ? coach.availableTimeSlots : [];
    
    // 解析查询日期
    const queryDate = new Date(date);
    const dayOfWeek = queryDate.getDay() || 7; // 将周日(0)转换为7
    
    // 检查教练当天是否可用
    if (!availableDays.includes(dayOfWeek)) {
      return NextResponse.json({
        success: true,
        data: {
          coachId,
          date,
          availableSlots: [],
          message: '该教练当天不可用'
        }
      });
    }
    
    // 获取当天已有的预约
    const bookings = await bookingManager.getBookingsByCoachAndDate(coachId, date);
    
    // 计算实时空闲时段
    const realTimeAvailableSlots = calculateRealTimeAvailableSlots(
      availableTimeSlots,
      bookings
    );
    
    return NextResponse.json({
      success: true,
      data: {
        coachId,
        date,
        availableSlots: realTimeAvailableSlots,
        message: '获取成功'
      }
    });
  } catch (error: any) {
    console.error('获取教练空闲时段失败:', error);
    return NextResponse.json(
      { error: '获取教练空闲时段失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 计算实时空闲时段
 * @param availableTimeSlots 教练的可用时间段
 * @param bookings 当天已有的预约
 * @returns 实时空闲时段列表
 */
function calculateRealTimeAvailableSlots(
  availableTimeSlots: Array<{ start: string; end: string }>,
  bookings: any[]
): Array<{ start: string; end: string }> {
  // 转换已预约时间段为时间区间对象
  const bookedIntervals = bookings.map(booking => {
    const scheduledDate = new Date(booking.scheduledDate);
    const duration = booking.duration || 60; // 默认60分钟
    
    const startTime = scheduledDate;
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    
    return {
      start: startTime,
      end: endTime
    };
  });
  
  // 转换可用时间段为时间区间对象
  const availableIntervals = availableTimeSlots.map(slot => {
    const [startHour, startMinute] = slot.start.split(':').map(Number);
    const [endHour, endMinute] = slot.end.split(':').map(Number);
    
    // 创建当天的日期对象
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(today);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(today);
    end.setHours(endHour, endMinute, 0, 0);
    
    return {
      start,
      end,
      originalStart: slot.start,
      originalEnd: slot.end
    };
  });
  
  // 计算空闲时段
  const realTimeSlots: Array<{ start: string; end: string }> = [];
  
  availableIntervals.forEach(availableInterval => {
    let currentStart = availableInterval.start;
    const availableEnd = availableInterval.end;
    
    // 过滤出与当前可用时间段重叠的预约
    const overlappingBookings = bookedIntervals.filter(booking => {
      return booking.start < availableEnd && booking.end > currentStart;
    });
    
    // 如果没有重叠的预约，整个时间段都可用
    if (overlappingBookings.length === 0) {
      realTimeSlots.push({
        start: availableInterval.originalStart,
        end: availableInterval.originalEnd
      });
      return;
    }
    
    // 按开始时间排序
    overlappingBookings.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // 检查可用时间段开始到第一个预约之间的空闲时间
    const firstBooking = overlappingBookings[0];
    if (currentStart < firstBooking.start) {
      const freeStart = formatTime(currentStart);
      const freeEnd = formatTime(firstBooking.start);
      realTimeSlots.push({ start: freeStart, end: freeEnd });
    }
    
    // 检查预约之间的空闲时间
    for (let i = 0; i < overlappingBookings.length - 1; i++) {
      const currentBooking = overlappingBookings[i];
      const nextBooking = overlappingBookings[i + 1];
      
      if (currentBooking.end < nextBooking.start) {
        const freeStart = formatTime(currentBooking.end);
        const freeEnd = formatTime(nextBooking.start);
        realTimeSlots.push({ start: freeStart, end: freeEnd });
      }
    }
    
    // 检查最后一个预约到可用时间段结束之间的空闲时间
    const lastBooking = overlappingBookings[overlappingBookings.length - 1];
    if (lastBooking.end < availableEnd) {
      const freeStart = formatTime(lastBooking.end);
      const freeEnd = formatTime(availableEnd);
      realTimeSlots.push({ start: freeStart, end: freeEnd });
    }
  });
  
  return realTimeSlots;
}

/**
 * 格式化时间为 HH:MM 格式
 * @param date Date对象
 * @returns 格式化后的时间字符串
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
