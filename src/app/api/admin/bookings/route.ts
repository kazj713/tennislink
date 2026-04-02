import { NextRequest, NextResponse } from "next/server";
import { bookingManager } from "@/storage/database/bookingManager";
import { verifyToken } from "@/lib/auth";

/**
 * 获取预约列表
 * GET /api/admin/bookings?coachId=xxx&userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = await verifyToken();
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "无权访问" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");
    const userId = searchParams.get("userId");

    // 获取预约列表
    const filters: any = {};
    if (coachId) filters.coachId = coachId;
    if (userId) filters.userId = userId;

    const bookings = await bookingManager.getBookings({ filters });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    return NextResponse.json(
      { success: false, message: "获取预约列表失败" },
      { status: 500 }
    );
  }
}
