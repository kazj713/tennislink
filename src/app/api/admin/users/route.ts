import { NextResponse } from "next/server";
import { userManager } from "@/storage/database/userManager";
import { verifyToken } from "@/lib/auth";

/**
 * 获取用户列表
 * GET /api/admin/users
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

    // 查询所有用户
    const users = await userManager.getUsers();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, message: "获取用户列表失败" },
      { status: 500 }
    );
  }
}
