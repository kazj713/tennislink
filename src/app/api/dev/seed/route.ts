import { NextResponse } from "next/server";
import { seedDatabase } from "@/storage/database/seed";

/**
 * 临时数据初始化API（无需权限）
 * POST /api/dev/seed
 * GET /api/dev/seed
 * 
 * 注意：此接口仅用于开发测试，生产环境应删除
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

/**
 * GET 方法支持，用于浏览器直接访问
 */
export async function GET() {
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
