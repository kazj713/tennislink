import { NextRequest, NextResponse } from "next/server";
import { venueManager } from "@/storage/database/venueManager";
import { verifyToken } from "@/lib/auth";
import { insertVenueSchema } from "@/storage/database/shared/schema";

/**
 * 获取场地详情
 * GET /api/admin/venues/[id]
 */
export async function GET(
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

    // 获取场地详情
    const venue = await venueManager.getVenueById(id);

    if (!venue) {
      return NextResponse.json(
        { success: false, message: "场地不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: venue,
    });
  } catch (error) {
    console.error("Get venue error:", error);
    return NextResponse.json(
      { success: false, message: "获取场地详情失败" },
      { status: 500 }
    );
  }
}

/**
 * 更新场地
 * PUT /api/admin/venues/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证管理员权限
    const token = await verifyToken();
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "无权访问" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 验证数据
    try {
      const validatedData = insertVenueSchema.parse(body);
      const venue = await venueManager.updateVenue(id, validatedData);

      return NextResponse.json({
        success: true,
        data: venue,
        message: "场地更新成功",
      });
    } catch (validationError) {
      return NextResponse.json(
        { success: false, error: "数据验证失败", details: String(validationError) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Update venue error:", error);
    return NextResponse.json(
      { success: false, error: "更新场地失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除场地
 * DELETE /api/admin/venues/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = await verifyToken();
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "无权访问" },
        { status: 403 }
      );
    }

    const result = await venueManager.deleteVenue(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "场地已删除",
    });
  } catch (error) {
    console.error("Delete venue error:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      {
        success: false,
        error: "删除场地失败",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
