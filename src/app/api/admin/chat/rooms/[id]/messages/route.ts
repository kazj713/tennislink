import { NextRequest, NextResponse } from "next/server";
import { chatManager } from "@/storage/database/chatManager";
import { verifyToken } from "@/lib/auth";

/**
 * 获取聊天室的所有消息（管理员）
 * GET /api/admin/chat/rooms/[id]/messages?limit=50&offset=0
 */
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // 验证管理员权限
    const token = await verifyToken();
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "无权访问" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const roomId = params.id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 获取聊天室消息
    const result = await chatManager.getAllRoomMessages(roomId, {
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("获取聊天室消息失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取聊天室消息失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
