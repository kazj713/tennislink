import { NextResponse } from "next/server";
import { seedDatabase } from "@/storage/database/seed";

/**
 * 数据初始化API
 * POST /api/admin/seed
 * 
 * 注意：此接口应该只允许管理员调用
 */
export async function POST() {
  try {
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "数据初始化成功",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "数据初始化失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
