import { NextResponse } from "next/server";
import { userManager } from "@/storage/database/userManager";
import { coachManager } from "@/storage/database/coachManager";
import { venueManager } from "@/storage/database/venueManager";
import { bookingManager } from "@/storage/database/bookingManager";
import { eq, and, sql } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { getDb } from "@/storage/database/instance";
import { bookings } from "@/storage/database/shared/schema";

/**
 * 获取后台统计数据
 * GET /api/admin/dashboard
 */
export async function GET() {
  try {
    // 验证管理员权限
    const token = await verifyToken();
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "无权访问" },
        { status: 403 }
      );
    }

    // 统计用户数
    const users = await userManager.getUsers();
    const totalUsers = users.length;

    // 统计教练数
    const coaches = await coachManager.getCoaches({ filters: { status: "approved" } });
    const totalCoaches = coaches.length;

    // 统计场地数
    const venues = await venueManager.getVenues({ filters: { isActive: true } });
    const totalVenues = venues.length;

    // 统计订单数
    const bookingList = await bookingManager.getBookings({});
    const totalBookings = bookingList.length;

    // 统计待审核教练数
    const pendingCoaches = await coachManager.getCoaches({ filters: { status: "pending" } });
    const pendingCoachApprovals = pendingCoaches.length;

    // 统计总收入
    let totalRevenue = 0;
    try {
      const db = await getDb();
      const [revenueResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${bookings.paymentAmount}), 0)`,
        })
        .from(bookings)
        .where(eq(bookings.paymentStatus, "paid"));
      totalRevenue = Number(revenueResult?.total) || 0;
    } catch (error) {
      console.error("Failed to calculate revenue:", error);
    }

    return NextResponse.json({
      totalUsers,
      totalCoaches,
      totalVenues,
      totalBookings,
      pendingCoachApprovals,
      totalRevenue,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "获取统计数据失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
