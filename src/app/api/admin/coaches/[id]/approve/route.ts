import { NextResponse } from "next/server";
import { coachManager } from "@/storage/database/coachManager";
import { verifyToken } from "@/lib/auth";

/**
 * 审核教练
 * POST /api/admin/coaches/[id]/approve
 * Body: { status: "approved" | "rejected" | "suspended" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证管理员权限
    const token = await verifyToken();
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "无权访问" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (
      !["approved", "rejected", "suspended"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, message: "无效的状态" },
        { status: 400 }
      );
    }

    // 更新教练状态
    await coachManager.updateCoach(id, { status: status as any });

    return NextResponse.json({
      success: true,
      message: `教练已${status === "approved" ? "通过" : status === "rejected" ? "拒绝" : "暂停"}`,
    });
  } catch (error) {
    console.error("Approve coach error:", error);
    return NextResponse.json(
      { success: false, message: "审核失败" },
      { status: 500 }
    );
  }
}
