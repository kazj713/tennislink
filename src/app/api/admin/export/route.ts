/**
 * 数据导出 API
 * 从数据库查询真实数据，支持导出为 CSV/JSON 格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken } from '@/lib/auth';
import { db } from '@/storage/database/instance';
import { users, coaches, venues, bookings, paymentOrders, courses } from '@/storage/database/shared/schema';
import { sql } from 'drizzle-orm';

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
 * 从数据库获取预订数据
 */
async function getBookingsData() {
  const result = await db.execute(sql`
    SELECT
      b.id,
      u.name as "userName",
      uc.name as "coachName",
      b.scheduled_date as date,
      b.duration,
      b.status,
      b.payment_amount as amount,
      b.created_at as "createdAt"
    FROM bookings b
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN users uc ON b.coach_id = (SELECT user_id FROM coaches WHERE id = b.coach_id LIMIT 1)
    ORDER BY b.created_at DESC
  `);
  return result.rows.map((row: any) => ({
    ...row,
    date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
  }));
}

/**
 * 从数据库获取用户数据
 */
async function getUsersData() {
  const result = await db.execute(sql`
    SELECT
      id,
      name,
      email,
      phone,
      role,
      skill_level as level,
      city,
      is_active as isActive,
      created_at as createdAt
    FROM users
    ORDER BY created_at DESC
  `);
  return result.rows;
}

/**
 * 从数据库获取教练数据
 */
async function getCoachesData() {
  const result = await db.execute(sql`
    SELECT
      c.id,
      u.name,
      u.email,
      u.phone,
      c.hourly_rate as hourlyRate,
      c.experience_years as yearsOfExperience,
      c.average_rating as rating,
      c.review_count as reviewCount,
      c.total_lessons as bookingCount,
      c.status
    FROM coaches c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
}

/**
 * 从数据库获取场地数据
 */
async function getVenuesData() {
  const result = await db.execute(sql`
    SELECT
      id,
      name,
      address,
      city,
      district,
      phone,
      type,
      is_active as status,
      created_at as createdAt
    FROM venues
    ORDER BY created_at DESC
  `);
  return result.rows;
}

/**
 * 从数据库获取支付数据
 */
async function getPaymentsData() {
  const result = await db.execute(sql`
    SELECT
      po.id,
      po.order_no as orderId,
      u.name as userName,
      po.amount,
      po.payment_method as method,
      po.status,
      po.paid_at as paidAt,
      po.created_at as createdAt
    FROM payment_orders po
    LEFT JOIN users u ON po.user_id = u.id
    ORDER BY po.created_at DESC
  `);
  return result.rows;
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

    // 验证参数
    if (!type || !['bookings', 'users', 'coaches', 'venues', 'payments'].includes(type)) {
      return NextResponse.json(
        { success: false, message: '无效的导出类型' },
        { status: 400 }
      );
    }

    // 从数据库获取数据
    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    switch (type) {
      case 'bookings':
        data = await getBookingsData();
        headers = ['id', 'userName', 'coachName', 'date', 'duration', 'status', 'amount', 'createdAt'];
        filename = `bookings_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'users':
        data = await getUsersData();
        headers = ['id', 'name', 'email', 'phone', 'role', 'level', 'city', 'isActive', 'createdAt'];
        filename = `users_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'coaches':
        data = await getCoachesData();
        headers = ['id', 'name', 'email', 'phone', 'hourlyRate', 'yearsOfExperience', 'rating', 'reviewCount', 'bookingCount', 'status'];
        filename = `coaches_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'venues':
        data = await getVenuesData();
        headers = ['id', 'name', 'address', 'city', 'district', 'phone', 'type', 'status', 'createdAt'];
        filename = `venues_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'payments':
        data = await getPaymentsData();
        headers = ['id', 'orderId', 'userName', 'amount', 'method', 'status', 'paidAt', 'createdAt'];
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
