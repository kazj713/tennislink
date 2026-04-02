import { NextResponse } from "next/server";
import { coachManager } from "@/storage/database/coachManager";
import { userManager } from "@/storage/database/userManager";
import { verifyToken } from "@/lib/auth";
import { getDb } from "coze-coding-dev-sdk";
import { coaches, users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

/**
 * 获取教练列表（含用户信息）
 * GET /api/admin/coaches
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

    // 查询所有教练
    const coachList = await coachManager.getCoaches();

    // 获取所有用户信息
    const userIds = coachList.map((coach) => coach.userId);
    const db = await getDb();
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "coach"));

    // 组合数据
    const result = coachList.map((coach) => {
      const user = allUsers.find((u) => u.id === coach.userId);
      return {
        ...coach,
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          avatar: user?.avatar,
          city: user?.city,
          skillLevel: user?.skillLevel,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get coaches error:", error);
    return NextResponse.json(
      { success: false, message: "获取教练列表失败" },
      { status: 500 }
    );
  }
}

/**
 * 添加教练
 * POST /api/admin/coaches
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

    // 解析请求体
    const body = await request.json();
    const {
      name,
      email,
      phone,
      city,
      skillLevel,
      experienceYears,
      hourlyRate,
      certifications,
      specialties
    } = body;

    // 验证必要字段
    if (!name || !email || !phone || !city) {
      return NextResponse.json(
        { success: false, message: "缺少必要字段" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await userManager.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // 创建用户账号
    const password = "coach123"; // 默认密码
    const user = await userManager.createUser({
      name,
      email,
      password,
      phone,
      city,
      role: "coach",
      skillLevel: skillLevel || 5
    });

    // 创建教练信息
    const coach = await coachManager.createCoach({
      userId: user.id,
      experienceYears: experienceYears || 1,
      hourlyRate: hourlyRate || 200,
      certifications: certifications || [],
      specialties: specialties || [],
      status: "approved" // 管理员添加的教练默认已通过审核
    });

    return NextResponse.json(
      {
        success: true,
        message: "教练添加成功",
        data: {
          ...coach,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city,
            skillLevel: user.skillLevel
          }
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add coach error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "添加教练失败",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
