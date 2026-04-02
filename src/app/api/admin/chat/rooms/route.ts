import { NextRequest, NextResponse } from "next/server";
import { chatManager } from "@/storage/database/chatManager";
import { verifyToken } from "@/lib/auth";

/**
 * 获取所有聊天室列表（管理员）
 * GET /api/admin/chat/rooms?limit=20&offset=0&keyword=xxx
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const keyword = searchParams.get("keyword") || "";

    // 获取聊天室列表
    const result = await chatManager.getAllChatRooms({
      limit,
      offset,
      keyword,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("获取聊天室列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取聊天室列表失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
