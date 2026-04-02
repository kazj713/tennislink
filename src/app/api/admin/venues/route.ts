import { NextRequest, NextResponse } from "next/server";
import { venueManager } from "@/storage/database/venueManager";
import { verifyToken } from "@/lib/auth";
import { insertVenueSchema } from "@/storage/database/shared/schema";

/**
 * 获取场地列表
 * GET /api/admin/venues
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

    // 查询所有场地
    const venues = await venueManager.getVenues();

    return NextResponse.json({
      success: true,
      data: venues,
    });
  } catch (error) {
    console.error("Get venues error:", error);
    return NextResponse.json(
      { success: false, message: "获取场地列表失败" },
      { status: 500 }
    );
  }
}

/**
 * 创建场地
 * POST /api/admin/venues
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = await verifyToken();
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "无权访问" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 验证数据
    try {
      const validatedData = insertVenueSchema.parse(body);
      const venue = await venueManager.createVenue(validatedData);

      return NextResponse.json({
        success: true,
        data: venue,
      });
    } catch (validationError) {
      return NextResponse.json(
        { success: false, message: "数据验证失败", error: String(validationError) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Create venue error:", error);
    return NextResponse.json(
      { success: false, message: "创建场地失败" },
      { status: 500 }
    );
  }
}
