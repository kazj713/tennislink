import { NextRequest, NextResponse } from "next/server";
import { refundManager } from "@/storage/database/refundManager";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = await verifyToken(request);
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "无权限", message: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;

    const skip = (page - 1) * limit;

    const refunds = await refundManager.getAllRefunds({
      skip,
      limit,
      status,
    });

    return NextResponse.json({
      success: true,
      data: refunds,
      pagination: {
        page,
        limit,
        total: refunds.length,
      },
    });
  } catch (error) {
    console.error("Get all refunds error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "服务器错误",
        message: "获取退款列表失败",
      },
      { status: 500 }
    );
  }
}
