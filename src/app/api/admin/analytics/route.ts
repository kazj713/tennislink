/**
 * 数据统计分析 API
 * 提供平台运营数据统计和分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken } from '@/lib/auth';

/**
 * 验证管理员权限
 */
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;

  const payload = await verifyJWTToken(token);
  return payload?.role === 'admin';
}

/**
 * 生成过去 N 天的日期数组
 */
function getLastNDays(n: number): string[] {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * 模拟统计数据
 * 实际项目中应该从数据库查询
 */
async function getAnalyticsData() {
  const last7Days = getLastNDays(7);
  const last30Days = getLastNDays(30);

  // 概览数据
  const overview = {
    totalUsers: 1256,
    totalCoaches: 48,
    totalVenues: 12,
    totalBookings: 3420,
    totalRevenue: 856000,
    todayBookings: 23,
    todayRevenue: 5800,
    pendingApprovals: 5,
  };

  // 趋势数据（最近7天）
  const trends = {
    bookings: last7Days.map((date, index) => ({
      date,
      count: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 10000) + 5000,
    })),
    users: last7Days.map((date) => ({
      date,
      newUsers: Math.floor(Math.random() * 20) + 5,
      activeUsers: Math.floor(Math.random() * 200) + 100,
    })),
  };

  // 用户统计
  const userStats = {
    byLevel: [
      { level: '1.0-2.0', count: 320, percentage: 25.5 },
      { level: '2.0-3.0', count: 480, percentage: 38.2 },
      { level: '3.0-4.0', count: 320, percentage: 25.5 },
      { level: '4.0-5.0', count: 136, percentage: 10.8 },
    ],
    byAge: [
      { range: '18-25', count: 280, percentage: 22.3 },
      { range: '26-35', count: 520, percentage: 41.4 },
      { range: '36-45', count: 320, percentage: 25.5 },
      { range: '46+', count: 136, percentage: 10.8 },
    ],
    growth: last30Days.map((date) => ({
      date,
      count: Math.floor(Math.random() * 30) + 10,
    })),
  };

  // 预订统计
  const bookingStats = {
    byStatus: [
      { status: 'completed', count: 2560, percentage: 74.9 },
      { status: 'pending', count: 480, percentage: 14.0 },
      { status: 'cancelled', count: 280, percentage: 8.2 },
      { status: 'refunded', count: 100, percentage: 2.9 },
    ],
    byHour: Array.from({ length: 14 }, (_, i) => ({
      hour: `${i + 8}:00`,
      count: Math.floor(Math.random() * 100) + 20,
    })),
    byDayOfWeek: [
      { day: '周一', count: 380 },
      { day: '周二', count: 420 },
      { day: '周三', count: 450 },
      { day: '周四', count: 480 },
      { day: '周五', count: 520 },
      { day: '周六', count: 680 },
      { day: '周日', count: 490 },
    ],
  };

  // 收入统计
  const revenueStats = {
    bySource: [
      { source: '课程预约', amount: 580000, percentage: 67.8 },
      { source: '场地租赁', amount: 180000, percentage: 21.0 },
      { source: '商品销售', amount: 56000, percentage: 6.5 },
      { source: '会员服务', amount: 40000, percentage: 4.7 },
    ],
    byMonth: Array.from({ length: 12 }, (_, i) => ({
      month: `${i + 1}月`,
      amount: Math.floor(Math.random() * 100000) + 50000,
    })),
    growth: {
      currentMonth: 86000,
      lastMonth: 72000,
      growthRate: 19.4,
    },
  };

  // 教练统计
  const coachStats = {
    topCoaches: [
      { id: '1', name: '李教练', bookings: 156, rating: 4.9, revenue: 46800 },
      { id: '2', name: '王教练', bookings: 128, rating: 4.8, revenue: 38400 },
      { id: '3', name: '张教练', bookings: 98, rating: 4.7, revenue: 29400 },
      { id: '4', name: '刘教练', bookings: 87, rating: 4.6, revenue: 26100 },
      { id: '5', name: '陈教练', bookings: 76, rating: 4.5, revenue: 22800 },
    ],
    byRating: [
      { rating: '5.0', count: 8 },
      { rating: '4.5-4.9', count: 18 },
      { rating: '4.0-4.4', count: 15 },
      { rating: '3.5-3.9', count: 5 },
      { rating: '<3.5', count: 2 },
    ],
  };

  // 场地统计
  const venueStats = {
    topVenues: [
      { id: '1', name: '朝阳网球中心', bookings: 420, revenue: 42000, utilization: 85 },
      { id: '2', name: '海淀网球俱乐部', bookings: 380, revenue: 45600, utilization: 78 },
      { id: '3', name: '丰台体育公园', bookings: 320, revenue: 25600, utilization: 72 },
      { id: '4', name: '西城网球中心', bookings: 280, revenue: 33600, utilization: 68 },
    ],
    utilization: {
      average: 75.8,
      byHour: Array.from({ length: 14 }, (_, i) => ({
        hour: `${i + 8}:00-${i + 9}:00`,
        rate: Math.floor(Math.random() * 40) + 50,
      })),
    },
  };

  return {
    overview,
    trends,
    userStats,
    bookingStats,
    revenueStats,
    coachStats,
    venueStats,
  };
}

/**
 * GET /api/admin/analytics
 * 获取统计数据
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: '权限不足' },
        { status: 403 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const data = await getAnalyticsData();

    // 根据类型返回数据
    if (type === 'all') {
      return NextResponse.json({
        success: true,
        data,
        generatedAt: new Date().toISOString(),
      });
    } else if (type in data) {
      return NextResponse.json({
        success: true,
        data: data[type as keyof typeof data],
        generatedAt: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { success: false, message: '无效的统计类型' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
