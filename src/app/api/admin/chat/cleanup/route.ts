import { NextResponse } from "next/server";
import { chatManager } from "@/storage/database/chatManager";
import { verifyToken } from "@/lib/auth";

/**
 * 清理30天前的聊天记录
 * POST /api/admin/chat/cleanup
 * 可以设置days参数来指定清理天数
 */
export async function POST(request: Request) {
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
    const days = body.days || 30; // 默认30天

    // 执行清理
    const deletedCount = await chatManager.deleteOldMessages(days);

    return NextResponse.json({
      success: true,
      message: `成功清理 ${deletedCount} 条 ${days} 天前的聊天记录`,
      data: {
        deletedCount,
        days,
      },
    });
  } catch (error) {
    console.error("清理聊天记录失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "清理聊天记录失败",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
