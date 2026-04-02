import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  vipMemberships,
  insertVipMembershipSchema,
  updateVipMembershipSchema,
  userVipSubscriptions,
  insertUserVipSubscriptionSchema,
  vipStatusEnum,
} from "./shared/schema";
import type {
  VipMembership,
  InsertVipMembership,
  UpdateVipMembership,
  UserVipSubscription,
  InsertUserVipSubscription,
} from "./shared/schema";

/**
 * VIP会员管理器
 * 负责VIP会员套餐和用户订阅相关的数据库操作
 */
export class VipManager {
  // ==================== VIP会员套餐相关 ====================

  /**
   * 创建VIP会员套餐
   * @param data 套餐数据
   * @returns 创建的套餐对象
   */
  async createMembership(data: InsertVipMembership): Promise<VipMembership> {
    const db = await getDb();
    const validated = insertVipMembershipSchema.parse(data);
    const [membership] = await db.insert(vipMemberships).values(validated).returning();
    return membership;
  }

  /**
   * 获取VIP会员套餐列表
   * @param options 查询选项
   * @returns 套餐列表
   */
  async getMemberships(options: {
    skip?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<VipMembership[]> {
    const { skip = 0, limit = 100, isActive } = options;
    const db = await getDb();

    const conditions: any[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(vipMemberships.isActive, isActive));
    }

    const query = db
      .select()
      .from(vipMemberships)
      .limit(limit)
      .offset(skip);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  /**
   * 根据ID获取VIP会员套餐
   * @param id 套餐ID
   * @returns 套餐对象，不存在则返回null
   */
  async getMembershipById(id: string): Promise<VipMembership | null> {
    const db = await getDb();
    const [membership] = await db.select().from(vipMemberships).where(eq(vipMemberships.id, id));
    return membership || null;
  }

  /**
   * 更新VIP会员套餐
   * @param id 套餐ID
   * @param data 要更新的数据
   * @returns 更新后的套餐对象，失败则返回null
   */
  async updateMembership(id: string, data: UpdateVipMembership): Promise<VipMembership | null> {
    const db = await getDb();
    const validated = updateVipMembershipSchema.parse(data);
    const [membership] = await db
      .update(vipMemberships)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(vipMemberships.id, id))
      .returning();
    return membership || null;
  }

  /**
   * 删除VIP会员套餐
   * @param id 套餐ID
   * @returns 是否删除成功
   */
  async deleteMembership(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(vipMemberships).where(eq(vipMemberships.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ==================== 用户VIP订阅相关 ====================

  /**
   * 创建用户VIP订阅
   * @param data 订阅数据
   * @returns 创建的订阅对象
   */
  async createSubscription(data: InsertUserVipSubscription): Promise<UserVipSubscription> {
    const db = await getDb();
    const validated = insertUserVipSubscriptionSchema.parse(data);
    const [subscription] = await db.insert(userVipSubscriptions).values(validated).returning();
    return subscription;
  }

  /**
   * 创建月度VIP订阅
   * @param userId 用户ID
   * @param membershipId 套餐ID
   * @param paymentAmount 支付金额
   * @param transactionId 交易ID
   * @returns 创建的订阅对象
   */
  async createMonthlySubscription(
    userId: string,
    membershipId: string,
    paymentAmount: number,
    transactionId: string
  ): Promise<UserVipSubscription> {
    const db = await getDb();
    
    // 获取会员套餐
    const membership = await this.getMembershipById(membershipId);
    if (!membership) {
      throw new Error("会员套餐不存在");
    }

    // 计算开始和结束日期
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + membership.duration);

    const subscriptionData: InsertUserVipSubscription = {
      userId,
      membershipId,
      startDate,
      endDate,
      status: "active",
      paymentAmount: paymentAmount.toString(),
      paymentStatus: "paid",
      transactionId,
    };

    return this.createSubscription(subscriptionData);
  }

  /**
   * 获取用户的VIP订阅
   * @param userId 用户ID
   * @returns 用户的订阅列表
   */
  async getUserSubscriptions(userId: string): Promise<UserVipSubscription[]> {
    const db = await getDb();
    return db
      .select()
      .from(userVipSubscriptions)
      .where(eq(userVipSubscriptions.userId, userId))
      .orderBy(desc(userVipSubscriptions.startDate));
  }

  /**
   * 获取用户当前有效的VIP订阅
   * @param userId 用户ID
   * @returns 有效的订阅对象，不存在则返回null
   */
  async getCurrentSubscription(userId: string): Promise<UserVipSubscription | null> {
    const db = await getDb();
    const now = new Date();
    const [subscription] = await db
      .select()
      .from(userVipSubscriptions)
      .where(
        and(
          eq(userVipSubscriptions.userId, userId),
          eq(userVipSubscriptions.status, "active"),
          sql`${userVipSubscriptions.startDate} <= ${now}`,
          sql`${userVipSubscriptions.endDate} >= ${now}`
        )
      )
      .limit(1);
    return subscription || null;
  }

  /**
   * 检查用户是否是VIP
   * @param userId 用户ID
   * @returns 是否是VIP
   */
  async checkUserIsVip(userId: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    return !!subscription;
  }

  /**
   * 更新VIP订阅状态
   * @param id 订阅ID
   * @param status 新状态
   * @returns 更新后的订阅对象
   */
  async updateSubscriptionStatus(id: string, status: "active" | "expired" | "cancelled"): Promise<UserVipSubscription | null> {
    const db = await getDb();
    const [subscription] = await db
      .update(userVipSubscriptions)
      .set({ status })
      .where(eq(userVipSubscriptions.id, id))
      .returning();
    return subscription || null;
  }

  /**
   * 取消VIP订阅
   * @param id 订阅ID
   * @returns 更新后的订阅对象
   */
  async cancelSubscription(id: string): Promise<UserVipSubscription | null> {
    return this.updateSubscriptionStatus(id, "cancelled");
  }

  /**
   * 自动更新过期的VIP订阅
   * @returns 更新的订阅数量
   */
  async updateExpiredSubscriptions(): Promise<number> {
    const db = await getDb();
    const now = new Date();
    const result = await db
      .update(userVipSubscriptions)
      .set({ status: "expired" })
      .where(
        and(
          eq(userVipSubscriptions.status, "active"),
          sql`${userVipSubscriptions.endDate} < ${now}`
        )
      );
    return result.rowCount ?? 0;
  }
}

export const vipManager = new VipManager();
