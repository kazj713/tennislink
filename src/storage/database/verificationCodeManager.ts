// 导入所需的数据库相关模块和类型
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  verificationCodes,
  insertVerificationCodeSchema,
  updateVerificationCodeSchema,
  type VerificationCode,
  type InsertVerificationCode,
  type UpdateVerificationCode,

} from "./shared/schema";

/**
 * 验证码管理器类
 * 负责验证码的创建、验证、过期检查等操作
 */
export class VerificationCodeManager {
  /**
   * 创建验证码
   * @param data 验证码数据
   * @returns 创建的验证码记录
   */
  async create(data: InsertVerificationCode): Promise<VerificationCode> {
    const db = await getDb();
    const validated = insertVerificationCodeSchema.parse(data);
    const [code] = await db.insert(verificationCodes).values(validated).returning();
    return code;
  }

  /**
   * 根据ID查找验证码
   * @param id 验证码ID
   * @returns 验证码记录或null
   */
  async findById(id: string): Promise<VerificationCode | null> {
    const db = await getDb();
    const [code] = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.id, id));
    return code || null;
  }

  /**
   * 根据目标（邮箱或手机号）和类型查找最新的未使用验证码
   * @param target 邮箱或手机号
   * @param type 验证码类型
   * @returns 最新的未使用验证码记录或null
   */
  async findLatestByTargetAndType(
    target: string,
    type: "register" | "login" | "bind_phone" | "bind_email" | "reset_password"
  ): Promise<VerificationCode | null> {
    const db = await getDb();
    const [code] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.target, target),
          eq(verificationCodes.type, type),
          eq(verificationCodes.isUsed, false)
        )
      )
      .orderBy(sql`${verificationCodes.createdAt} DESC`)
      .limit(1);
    return code || null;
  }

  /**
   * 验证验证码
   * @param target 邮箱或手机号
   * @param code 验证码
   * @param type 验证码类型
   * @returns 验证成功返回验证码记录，失败返回null
   */
  async verify(
    target: string,
    code: string,
    type: "register" | "login" | "bind_phone" | "bind_email" | "reset_password"
  ): Promise<VerificationCode | null> {
    const db = await getDb();
    const now = new Date();

    // 查找未使用的验证码
    const verificationCode = await this.findLatestByTargetAndType(target, type);

    if (!verificationCode) {
      return null;
    }

    // 检查验证码是否匹配
    if (verificationCode.code !== code) {
      return null;
    }

    // 检查验证码是否过期
    if (verificationCode.expiresAt < now) {
      return null;
    }

    // 标记为已使用
    const [updated] = await db
      .update(verificationCodes)
      .set({ isUsed: true })
      .where(eq(verificationCodes.id, verificationCode.id))
      .returning();

    return updated;
  }

  /**
   * 检查是否可以发送新的验证码
   * 防止频繁发送验证码，限制同一目标在1分钟内只能发送1次
   * @param target 邮箱或手机号
   * @param type 验证码类型
   * @returns 是否可以发送
   */
  async canSendCode(
    target: string,
    type: "register" | "login" | "bind_phone" | "bind_email" | "reset_password"
  ): Promise<boolean> {
    const db = await getDb();
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    // 查找1分钟内是否发送过验证码
    const [recentCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.target, target),
          eq(verificationCodes.type, type),
          sql`${verificationCodes.createdAt} > ${oneMinuteAgo}`
        )
      )
      .orderBy(sql`${verificationCodes.createdAt} DESC`)
      .limit(1);

    return !recentCode;
  }

  /**
   * 清理过期的验证码
   * 删除所有已过期的验证码记录
   * @returns 删除的记录数
   */
  async cleanupExpiredCodes(): Promise<number> {
    const db = await getDb();
    const now = new Date();

    const result = await db
      .delete(verificationCodes)
      .where(sql`${verificationCodes.expiresAt} < ${now}`);

    return (result.rowCount ?? 0);
  }

  /**
   * 生成6位随机验证码
   * @returns 6位数字字符串
   */
  static generateCode(): string {
    // 生成000000-999999之间的随机数
    const code = Math.floor(Math.random() * 1000000);
    // 补零到6位
    return code.toString().padStart(6, "0");
  }

  /**
   * 计算验证码过期时间
   * @param minutes 过期分钟数，默认5分钟
   * @returns 过期时间
   */
  static calculateExpiresAt(minutes: number = 5): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}

// 导出验证码管理器单例
export const verificationCodeManager = new VerificationCodeManager();
