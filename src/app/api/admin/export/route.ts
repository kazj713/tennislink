/**
 * 数据导出 API
 * 支持导出订单、用户、课程等数据为 Excel/CSV 格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken } from '@/lib/auth';

// 导出格式类型
 type ExportFormat = 'csv' | 'json';

// 导出数据类型
 type ExportType = 'bookings' | 'users' | 'coaches' | 'venues' | 'payments';

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
 * 将数据转换为 CSV 格式
 */
function convertToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) return headers.join(',');

  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value = item[header];
        // 处理包含逗号或换行符的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * 获取预订数据
 */
async function getBookingsData() {
  // 这里应该从数据库获取数据
  // 示例数据
  return [
    {
      id: 'booking-1',
      userName: '张三',
      coachName: '李教练',
      venueName: '朝阳网球中心',
      date: '2024-01-15',
      time: '14:00-16:00',
      status: 'completed',
      amount: 400,
      createdAt: '2024-01-10T10:00:00Z',
    },
    {
      id: 'booking-2',
      userName: '李四',
      coachName: '王教练',
      venueName: '海淀网球俱乐部',
      date: '2024-01-16',
      time: '10:00-12:00',
      status: 'pending',
      amount: 350,
      createdAt: '2024-01-11T09:00:00Z',
    },
  ];
}

/**
 * 获取用户数据
 */
async function getUsersData() {
  return [
    {
      id: 'user-1',
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138001',
      role: 'user',
      level: '3.0',
      createdAt: '2024-01-01T00:00:00Z',
      bookingCount: 5,
      totalSpent: 2000,
    },
    {
      id: 'user-2',
      name: '李四',
      email: 'lisi@example.com',
      phone: '13800138002',
      role: 'user',
      level: '2.5',
      createdAt: '2024-01-05T00:00:00Z',
      bookingCount: 3,
      totalSpent: 1200,
    },
  ];
}

/**
 * 获取教练数据
 */
async function getCoachesData() {
  return [
    {
      id: 'coach-1',
      name: '李教练',
      email: 'licoach@example.com',
      phone: '13900139001',
      hourlyRate: 300,
      yearsOfExperience: 10,
      rating: 4.8,
      reviewCount: 128,
      bookingCount: 50,
      totalEarnings: 15000,
      status: 'active',
    },
    {
      id: 'coach-2',
      name: '王教练',
      email: 'wangcoach@example.com',
      phone: '13900139002',
      hourlyRate: 250,
      yearsOfExperience: 5,
      rating: 4.5,
      reviewCount: 64,
      bookingCount: 30,
      totalEarnings: 7500,
      status: 'active',
    },
  ];
}

/**
 * 获取场地数据
 */
async function getVenuesData() {
  return [
    {
      id: 'venue-1',
      name: '朝阳网球中心',
      address: '北京市朝阳区朝阳公园南路1号',
      phone: '010-12345678',
      courts: 12,
      pricePerHour: 100,
      rating: 4.8,
      reviewCount: 256,
      bookingCount: 100,
      totalRevenue: 50000,
      status: 'active',
    },
    {
      id: 'venue-2',
      name: '海淀网球俱乐部',
      address: '北京市海淀区中关村大街1号',
      phone: '010-87654321',
      courts: 8,
      pricePerHour: 120,
      rating: 4.6,
      reviewCount: 189,
      bookingCount: 80,
      totalRevenue: 40000,
      status: 'active',
    },
  ];
}

/**
 * 获取支付数据
 */
async function getPaymentsData() {
  return [
    {
      id: 'payment-1',
      orderId: 'order-1',
      userName: '张三',
      amount: 400,
      method: 'wechat',
      status: 'success',
      createdAt: '2024-01-10T10:00:00Z',
      paidAt: '2024-01-10T10:05:00Z',
    },
    {
      id: 'payment-2',
      orderId: 'order-2',
      userName: '李四',
      amount: 350,
      method: 'alipay',
      status: 'success',
      createdAt: '2024-01-11T09:00:00Z',
      paidAt: '2024-01-11T09:03:00Z',
    },
  ];
}

/**
 * GET /api/admin/export
 * 导出数据
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
    const type = searchParams.get('type') as ExportType;
    const format = (searchParams.get('format') || 'csv') as ExportFormat;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 验证参数
    if (!type || !['bookings', 'users', 'coaches', 'venues', 'payments'].includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的导出类型' },
        { status: 400 }
      );
    }

    // 获取数据
    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    switch (type) {
      case 'bookings':
        data = await getBookingsData();
        headers = ['id', 'userName', 'coachName', 'venueName', 'date', 'time', 'status', 'amount', 'createdAt'];
        filename = `bookings_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'users':
        data = await getUsersData();
        headers = ['id', 'name', 'email', 'phone', 'role', 'level', 'createdAt', 'bookingCount', 'totalSpent'];
        filename = `users_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'coaches':
        data = await getCoachesData();
        headers = ['id', 'name', 'email', 'phone', 'hourlyRate', 'yearsOfExperience', 'rating', 'reviewCount', 'bookingCount', 'totalEarnings', 'status'];
        filename = `coaches_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'venues':
        data = await getVenuesData();
        headers = ['id', 'name', 'address', 'phone', 'courts', 'pricePerHour', 'rating', 'reviewCount', 'bookingCount', 'totalRevenue', 'status'];
        filename = `venues_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'payments':
        data = await getPaymentsData();
        headers = ['id', 'orderId', 'userName', 'amount', 'method', 'status', 'createdAt', 'paidAt'];
        filename = `payments_${new Date().toISOString().split('T')[0]}`;
        break;
    }

    // 根据格式返回数据
    if (format === 'csv') {
      const csv = convertToCSV(data, headers);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        data,
        meta: {
          total: data.length,
          exportedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('导出数据失败:', error);
    return NextResponse.json(
      { success: false, message: '导出数据失败' },
      { status: 500 }
    );
  }
}
