// 导入所需的数据库相关模块和类型
import { eq, and, sql, gte, lt } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  userModificationLogs,
  insertUserModificationLogSchema,
  type UserModificationLog,
  type InsertUserModificationLog,

} from "./shared/schema";

/**
 * 用户修改日志管理器类
 * 负责记录和查询用户修改历史，实现每月修改次数限制
 */
export class UserModificationLogManager {
  /**
   * 创建用户修改记录
   * @param data 修改记录数据
   * @returns 创建的修改记录
   */
  async create(data: InsertUserModificationLog): Promise<UserModificationLog> {
    const db = await getDb();
    const validated = insertUserModificationLogSchema.parse(data);
    const [log] = await db.insert(userModificationLogs).values(validated).returning();
    return log;
  }

  /**
   * 获取用户在指定月份内某类修改的次数
   * @param userId 用户ID
   * @param type 修改类型
   * @param year 年份
   * @param month 月份（1-12）
   * @returns 修改次数
   */
  async getModificationCountInMonth(
    userId: string,
    type: "email" | "phone" | "username" | "avatar",
    year: number,
    month: number
  ): Promise<number> {
    const db = await getDb();
    
    // 格式化月份为 YYYY-MM
    const monthStr = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;

    // 统计该月该类型的修改次数
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userModificationLogs)
      .where(
        and(
          eq(userModificationLogs.userId, userId),
          eq(userModificationLogs.type, type),
          eq(userModificationLogs.month, monthStr)
        )
      )
      .then((rows) => rows[0]);

    return result?.count ?? 0;
  }

  /**
   * 检查用户在当前月是否可以执行某类修改
   * @param userId 用户ID
   * @param type 修改类型
   * @param maxCount 最大允许修改次数，默认为1
   * @returns 是否可以修改
   */
  async canModify(
    userId: string,
    type: "email" | "phone" | "username" | "avatar",
    maxCount: number = 1
  ): Promise<boolean> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 月份从1开始

    const count = await this.getModificationCountInMonth(userId, type, year, month);
    return count < maxCount;
  }

  /**
   * 记录用户修改
   * @param userId 用户ID
   * @param type 修改类型
   * @param oldValue 修改前的值
   * @param newValue 修改后的值
   * @returns 创建的修改记录
   */
  async logModification(
    userId: string,
    type: "email" | "phone" | "username" | "avatar",
    oldValue: string | null,
    newValue: string
  ): Promise<UserModificationLog> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // 格式化月份为 YYYY-MM
    const monthStr = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;

    return this.create({
      userId,
      type,
      oldValue,
      newValue,
      month: monthStr,
    });
  }

  /**
   * 获取用户的所有修改历史
   * @param userId 用户ID
   * @returns 修改历史记录列表
   */
  async getUserLogs(userId: string): Promise<UserModificationLog[]> {
    const db = await getDb();
    return db
      .select()
      .from(userModificationLogs)
      .where(eq(userModificationLogs.userId, userId))
      .orderBy(sql`${userModificationLogs.createdAt} DESC`);
  }

  /**
   * 获取用户某类修改的历史
   * @param userId 用户ID
   * @param type 修改类型
   * @param limit 返回数量限制
   * @returns 修改历史记录列表
   */
  async getUserLogsByType(
    userId: string,
    type: "email" | "phone" | "username" | "avatar",
    limit: number = 10
  ): Promise<UserModificationLog[]> {
    const db = await getDb();
    return db
      .select()
      .from(userModificationLogs)
      .where(
        and(
          eq(userModificationLogs.userId, userId),
          eq(userModificationLogs.type, type)
        )
      )
      .orderBy(sql`${userModificationLogs.createdAt} DESC`)
      .limit(limit);
  }

  /**
   * 获取用户在当前月剩余的修改次数
   * @param userId 用户ID
   * @param type 修改类型
   * @param maxCount 最大允许修改次数，默认为1
   * @returns 剩余修改次数
   */
  async getRemainingModifications(
    userId: string,
    type: "email" | "phone" | "username" | "avatar",
    maxCount: number = 1
  ): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const count = await this.getModificationCountInMonth(userId, type, year, month);
    return Math.max(0, maxCount - count);
  }

  /**
   * 清理指定月之前的修改记录
   * @param monthsToKeep 保留月数
   * @returns 删除的记录数
   */
  async cleanupOldLogs(monthsToKeep: number = 12): Promise<number> {
    const db = await getDb();
    
    // 计算截止日期
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    const cutoffMonth = `${cutoffDate.getFullYear().toString().padStart(4, "0")}-${(cutoffDate.getMonth() + 1).toString().padStart(2, "0")}`;

    const result = await db
      .delete(userModificationLogs)
      .where(lt(userModificationLogs.month, cutoffMonth));

    return (result.rowCount ?? 0);
  }

  /**
   * 检查用户本月是否修改过某类信息
   * @param userId 用户ID
   * @param type 修改类型
   * @returns 是否修改过
   */
  async hasModifiedThisMonth(
    userId: string,
    type: "email" | "phone" | "username" | "avatar"
  ): Promise<boolean> {
    const count = await this.getRemainingModifications(userId, type, 1);
    return count === 0;
  }
}

// 导出用户修改日志管理器单例
export const userModificationLogManager = new UserModificationLogManager();
