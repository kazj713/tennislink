import { db } from "./instance";
import { users } from "./shared/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

/**
 * 数据初始化脚本（生产环境）
 * 仅创建管理员账号，其他数据由管理员通过后台添加
 */
export async function seedDatabase() {
  console.log("🌱 开始初始化数据...");

  try {
    // 从环境变量读取管理员账号配置
    const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@tennislink.com';
    const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123456';

    if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
      console.warn('⚠️  生产环境未设置 SEED_ADMIN_PASSWORD，使用默认密码');
    }

    // 仅创建管理员用户
    const adminPassword = await hashPassword(SEED_ADMIN_PASSWORD);
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, SEED_ADMIN_EMAIL));

    if (!existingAdmin) {
      await db.insert(users).values({
        email: SEED_ADMIN_EMAIL,
        password: adminPassword,
        name: "系统管理员",
        role: "admin",
        phone: "13800000000",
        city: "北京",
        isActive: true,
      });
      console.log(`✅ 创建管理员用户: ${SEED_ADMIN_EMAIL}`);
    } else {
      console.log(`⏭️  管理员用户已存在: ${SEED_ADMIN_EMAIL}`);
    }

    console.log("\n🎉 数据初始化完成！（仅创建管理员账号）");
    console.log("\n📋 管理员登录信息：");
    console.log(`  邮箱：${SEED_ADMIN_EMAIL}`);
    console.log(`  密码：${SEED_ADMIN_PASSWORD}`);
    console.log("\n💡 提示：教练、场地、课程等数据请通过管理后台添加");

  } catch (error) {
    console.error("❌ 数据初始化失败:", error);
    throw error;
  }
}
