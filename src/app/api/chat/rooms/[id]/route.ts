import { NextRequest, NextResponse } from "next/server";
import { chatManager } from "@/storage/database/chatManager";
import { verifyToken } from "@/lib/auth";

/**
 * 获取聊天室详情
 * GET /api/chat/rooms/[id]
 */
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // 验证用户身份
    const token = await verifyToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "未授权" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const roomId = params.id;

    // 获取聊天室详情
    const room = await chatManager.getChatRoomDetail(roomId, token.userId);

    if (!room) {
      return NextResponse.json(
        { success: false, message: "聊天室不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("获取聊天室详情失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取聊天室详情失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 标记消息为已读
 * POST /api/chat/rooms/[id]/read
 */
export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // 验证用户身份
    const token = await verifyToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "未授权" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const roomId = params.id;

    // 标记消息为已读
    const success = await chatManager.markAsRead(roomId, token.userId);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "标记已读失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "标记成功",
    });
  } catch (error) {
    console.error("标记消息已读失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "标记消息已读失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
