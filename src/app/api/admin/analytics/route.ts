/**
 * 数据统计分析 API
 * 提供平台运营数据统计和分析（所有数据从数据库聚合查询获取）
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken } from '@/lib/auth';
import {
  users,
  coaches,
  venues,
  bookings,
  courses,
  communityPosts,
  matchups,
  courtBookings,
  venueBookings,
  paymentOrders,
} from '@/storage/database/shared/schema';
import { sql, eq, and, gte, lte, count, sum, desc } from 'drizzle-orm';
import { getDb } from "@/storage/database/instance";

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
 * 获取过去 N 天的日期数组
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
 * 从数据库聚合查询获取所有统计数据
 */
async function getAnalyticsData(type?: string) {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];

  // === 概览数据 ===
  let overview: Record<string, any> = {
    totalUsers: 0,
    totalCoaches: 0,
    totalVenues: 0,
    totalBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
  };

  try {
    // 总用户数：SELECT COUNT(*) FROM users
    const [userCount] = await db.select({
      value: count(),
    }).from(users);
    overview.totalUsers = Number(userCount.value) || 0;
  } catch (e) {
    console.error('查询总用户数失败:', e);
  }

  try {
    // 总教练数（已审核）：SELECT COUNT(*) FROM coaches WHERE status='approved'
    const [coachCount] = await db.select({
      value: count(),
    }).from(coaches).where(eq(coaches.status, 'approved'));
    overview.totalCoaches = Number(coachCount.value) || 0;
  } catch (e) {
    console.error('查询总教练数失败:', e);
  }

  try {
    // 总场地数（活跃）：SELECT COUNT(*) FROM venues WHERE is_active=true
    const [venueCount] = await db.select({
      value: count(),
    }).from(venues).where(eq(venues.isActive, true));
    overview.totalVenues = Number(venueCount.value) || 0;
  } catch (e) {
    console.error('查询总场地数失败:', e);
  }

  try {
    // 总预订数：SELECT COUNT(*) FROM bookings
    const [bookingCount] = await db.select({
      value: count(),
    }).from(bookings);
    overview.totalBookings = Number(bookingCount.value) || 0;
  } catch (e) {
    console.error('查询总预订数失败:', e);
  }

  try {
    // 总收入：COALESCE(SUM(payment_amount), 0) FROM bookings WHERE payment_status='paid'
    const [revenueResult] = await db.select({
      value: sql<number>`COALESCE(SUM(${bookings.paymentAmount}), 0)`,
    }).from(bookings).where(eq(bookings.paymentStatus, 'paid'));
    overview.totalRevenue = Number(revenueResult.value) || 0;
  } catch (e) {
    console.error('查询总收入失败:', e);
  }

  try {
    // 今日预订数：COUNT bookings where scheduled_date >= today start
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const [todayBookingResult] = await db.select({
      value: count(),
    }).from(bookings).where(gte(bookings.scheduledDate, todayStart));
    overview.todayBookings = Number(todayBookingResult.value) || 0;
  } catch (e) {
    console.error('查询今日预订数失败:', e);
  }

  try {
    // 今日收入：SUM payment_amount for today's paid bookings
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const [todayRevenueResult] = await db.select({
      value: sql<number>`COALESCE(SUM(${bookings.paymentAmount}), 0)`,
    })
      .from(bookings)
      .where(
        and(
          gte(bookings.scheduledDate, todayStart),
          eq(bookings.paymentStatus, 'paid')
        )
      );
    overview.todayRevenue = Number(todayRevenueResult.value) || 0;
  } catch (e) {
    console.error('查询今日收入失败:', e);
  }

  try {
    // 待审核教练数：COUNT coaches WHERE status='pending'
    const [pendingResult] = await db.select({
      value: count(),
    }).from(coaches).where(eq(coaches.status, 'pending'));
    overview.pendingApprovals = Number(pendingResult.value) || 0;
  } catch (e) {
    console.error('查询待审核教练数失败:', e);
  }

  // === 趋势数据（最近7天）===
  let trends: Record<string, any> = {
    bookings: [],
    users: [],
  };

  try {
    // 按日期分组统计每天 booking 数量和收入（最近7天）
    const last7Days = getLastNDays(7);
    for (const date of last7Days) {
      const dayStart = new Date(date + 'T00:00:00.000Z');
      const dayEnd = new Date(date + 'T23:59:59.999Z');

      try {
        const [dayStats] = await db.select({
          count: count(),
          revenue: sql<number>`COALESCE(SUM(${bookings.paymentAmount}), 0)`,
        })
          .from(bookings)
          .where(
            and(
              gte(bookings.scheduledDate, dayStart),
              lte(bookings.scheduledDate, dayEnd)
            )
          );

        trends.bookings.push({
          date,
          count: Number(dayStats.count) || 0,
          revenue: Number(dayStats.revenue) || 0,
        });
      } catch {
        trends.bookings.push({ date, count: 0, revenue: 0 });
      }
    }
  } catch (e) {
    console.error('查询趋势-预订数据失败:', e);
    trends.bookings = [];
  }

  try {
    // 按日期分组统计每天新注册用户数和活跃用户（最近7天）
    const last7Days = getLastNDays(7);
    for (const date of last7Days) {
      const dayStart = new Date(date + 'T00:00:00.000Z');
      const dayEnd = new Date(date + 'T23:59:59.999Z');

      try {
        const [dayUserStats] = await db.select({
          newUsers: count(),
        })
          .from(users)
          .where(
            and(
              gte(users.createdAt, dayStart),
              lte(users.createdAt, dayEnd)
            )
          );

        trends.users.push({
          date,
          newUsers: Number(dayUserStats.newUsers) || 0,
        });
      } catch {
        trends.users.push({ date, newUsers: 0 });
      }
    }
  } catch (e) {
    console.error('查询趋势-用户数据失败:', e);
    trends.users = [];
  }

  // === 用户统计 ===
  let userStats: Record<string, any> = {
    byLevel: [],
    growth: [],
  };

  try {
    // 按 skill_level 分组统计用户数量及百分比
    const levelRows = await db.select({
      level: users.skillLevel,
      cnt: count(),
    })
      .from(users)
      .groupBy(users.skillLevel)
      .orderBy(users.skillLevel);

    const totalUserCount = levelRows.reduce((sum, r) => sum + Number(r.cnt), 0) || 1;

    userStats.byLevel = levelRows.map((row) => ({
      level: `${row.level}.0-${Number(row.level) + 1}.0`,
      count: Number(row.cnt),
      percentage: Math.round((Number(row.cnt) / totalUserCount) * 1000) / 10,
    }));
  } catch (e) {
    console.error('查询用户水平分布失败:', e);
    userStats.byLevel = [];
  }

  try {
    // 最近30天每天新注册用户数
    const last30Days = getLastNDays(30);
    for (const date of last30Days) {
      const dayStart = new Date(date + 'T00:00:00.000Z');
      const dayEnd = new Date(date + 'T23:59:59.999Z');

      try {
        const [dayReg] = await db.select({
          cnt: count(),
        })
          .from(users)
          .where(
            and(
              gte(users.createdAt, dayStart),
              lte(users.createdAt, dayEnd)
            )
          );

        userStats.growth.push({ date, count: Number(dayReg.cnt) || 0 });
      } catch {
        userStats.growth.push({ date, count: 0 });
      }
    }
  } catch (e) {
    console.error('查询用户增长数据失败:', e);
    userStats.growth = [];
  }

  // === 预订统计 ===
  let bookingStats: Record<string, any> = {
    byStatus: [],
    byDayOfWeek: [],
  };

  try {
    // 按 status 分组统计预订数量及百分比
    const statusRows = await db.select({
      status: bookings.status,
      cnt: count(),
    })
      .from(bookings)
      .groupBy(bookings.status);

    const totalBookingCount = statusRows.reduce((sum, r) => sum + Number(r.cnt), 0) || 1;

    bookingStats.byStatus = statusRows.map((row) => ({
      status: row.status,
      count: Number(row.cnt),
      percentage: Math.round((Number(row.cnt) / totalBookingCount) * 1000) / 10,
    }));
  } catch (e) {
    console.error('查询预订状态分布失败:', e);
    bookingStats.byStatus = [];
  }

  try {
    // 提取星期几统计预订分布
    const dowRows = await db.select({
      dow: sql<number>`EXTRACT(DOW FROM ${bookings.scheduledDate})`,
      cnt: count(),
    })
      .from(bookings)
      .groupBy(sql`EXTRACT(DOW FROM ${bookings.scheduledDate})`)
      .orderBy(sql`EXTRACT(DOW FROM ${bookings.scheduledDate})`);

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 确保返回完整的一周数据，无数据的日期显示为0
    const dowMap = new Map(dowRows.map((r) => [Number(r.dow), Number(r.cnt)]));

    bookingStats.byDayOfWeek = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
      day: dayNames[dow],
      count: dowMap.get(dow) || 0,
    }));
  } catch (e) {
    console.error('查询预订星期分布失败:', e);
    bookingStats.byDayOfWeek = [];
  }

  // === 收入统计 ===
  let revenueStats: Record<string, any> = {
    byMonth: [],
    growth: {
      currentMonth: 0,
      lastMonth: 0,
      growthRate: 0,
    },
  };

  try {
    // 近12个月按月分组统计收入
    const monthRows = await db.select({
      month: sql<string>`TO_CHAR(${bookings.scheduledDate}, 'YYYY-MM')`,
      amount: sql<number>`COALESCE(SUM(${bookings.paymentAmount}), 0)`,
    })
      .from(bookings)
      .where(eq(bookings.paymentStatus, 'paid'))
      .groupBy(sql`TO_CHAR(${bookings.scheduledDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bookings.scheduledDate}, 'YYYY-MM')`);

    revenueStats.byMonth = monthRows.map((row) => ({
      month: row.month,
      amount: Number(row.amount) || 0,
    }));

    // 计算本月 vs 上月收入对比及增长率
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthData = monthRows.find((r) => r.month === currentMonthStr);
    const lastMonthData = monthRows.find((r) => r.month === lastMonthStr);

    const currentMonthRevenue = Number(currentMonthData?.amount) || 0;
    const lastMonthRevenue = Number(lastMonthData?.amount) || 0;

    revenueStats.growth.currentMonth = currentMonthRevenue;
    revenueStats.growth.lastMonth = lastMonthRevenue;
    revenueStats.growth.growthRate =
      lastMonthRevenue > 0
        ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
        : 0;
  } catch (e) {
    console.error('查询收入统计失败:', e);
    revenueStats.byMonth = [];
  }

  // === 教练统计 ===
  let coachStats: Record<string, any> = {
    topCoaches: [],
    byRating: [],
  };

  try {
    // JOIN coaches+users 按 booking 数量/评分排序 TOP 5
    const topCoachRows = await db
      .select({
        id: coaches.id,
        name: users.name,
        bookingCnt: count(),
        rating: coaches.averageRating,
        revenue: sql<number>`COALESCE(SUM(${bookings.paymentAmount}), 0)`,
      })
      .from(coaches)
      .innerJoin(users, eq(coaches.userId, users.id))
      .leftJoin(bookings, eq(coaches.id, bookings.coachId))
      .where(eq(coaches.status, 'approved'))
      .groupBy(coaches.id, users.name, coaches.averageRating)
      .orderBy(desc(count()))
      .limit(5);

    coachStats.topCoaches = topCoachRows.map((row) => ({
      id: row.id,
      name: row.name,
      bookings: Number(row.bookingCnt),
      rating: Number(row.rating) || 0,
      revenue: Number(row.revenue) || 0,
    }));
  } catch (e) {
    console.error('查询热门教练失败:', e);
    coachStats.topCoaches = [];
  }

  try {
    // 按 average_rating 区间分组统计教练数
    const allCoaches = await db.select({
      rating: coaches.averageRating,
    }).from(coaches).where(eq(coaches.status, 'approved'));

    const buckets: Record<string, number> = {
      '5.0': 0,
      '4.5-4.9': 0,
      '4.0-4.4': 0,
      '3.5-3.9': 0,
      '<3.5': 0,
    };

    for (const c of allCoaches) {
      const r = Number(c.rating) || 0;
      if (r >= 5.0) buckets['5.0']++;
      else if (r >= 4.5) buckets['4.5-4.9']++;
      else if (r >= 4.0) buckets['4.0-4.4']++;
      else if (r >= 3.5) buckets['3.5-3.9']++;
      else buckets['<3.5']++;
    }

    coachStats.byRating = Object.entries(buckets).map(([rating, count]) => ({
      rating,
      count,
    }));
  } catch (e) {
    console.error('查询教练评分分布失败:', e);
    coachStats.byRating = [];
  }

  // === 场地统计 ===
  let venueStats: Record<string, any> = {
    topVenues: [],
  };

  try {
    // 按 booking 关联统计 TOP 场地
    const topVenueRows = await db
      .select({
        id: venues.id,
        name: venues.name,
        bookingCnt: count(),
        revenue: sql<number>`COALESCE(SUM(${venueBookings.paymentAmount}), 0)`,
      })
      .from(venues)
      .leftJoin(venueBookings, eq(venues.id, venueBookings.venueId))
      .where(eq(venues.isActive, true))
      .groupBy(venues.id, venues.name)
      .orderBy(desc(count()))
      .limit(5);

    venueStats.topVenues = topVenueRows.map((row) => ({
      id: row.id,
      name: row.name,
      bookings: Number(row.bookingCnt),
      revenue: Number(row.revenue) || 0,
    }));
  } catch (e) {
    console.error('查询热门场地失败:', e);
    venueStats.topVenues = [];
  }

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
 * 获取统计数据（所有数据从数据库聚合查询获取）
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

    const data = await getAnalyticsData(type);

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
