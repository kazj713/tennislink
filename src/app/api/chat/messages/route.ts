import { NextRequest, NextResponse } from "next/server";
import { chatManager } from "@/storage/database/chatManager";
import { verifyToken } from "@/lib/auth";

/**
 * 发送消息
 * POST /api/chat/messages
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const token = await verifyToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "未授权" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roomId, content, messageType = "text" } = body;

    if (!roomId || !content) {
      return NextResponse.json(
        { success: false, message: "参数错误" },
        { status: 400 }
      );
    }

    // 发送消息
    const message = await chatManager.sendMessage({
      roomId,
      userId: token.userId,
      content,
      messageType,
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: "发送消息失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("发送消息失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "发送消息失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 获取消息列表
 * GET /api/chat/messages?roomId=xxx&limit=50&beforeId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = await verifyToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "未授权" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const beforeId = searchParams.get("beforeId");
    const afterId = searchParams.get("afterId");

    if (!roomId) {
      return NextResponse.json(
        { success: false, message: "roomId参数错误" },
        { status: 400 }
      );
    }

    // 获取消息列表
    const messages = await chatManager.getMessages(roomId, {
      limit,
      beforeId: beforeId || undefined,
      afterId: afterId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("获取消息列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "获取消息列表失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
