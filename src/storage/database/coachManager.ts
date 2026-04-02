import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { db } from "./instance";
import {
  coaches,
  insertCoachSchema,
  updateCoachSchema,
  coachReviews,
  insertCoachReviewSchema,
  users,
} from "./shared/schema";
import type {
  Coach,
  InsertCoach,
  UpdateCoach,
  CoachReview,
  InsertCoachReview,
} from "./shared/schema";

/**
 * 教练管理器
 * 负责教练相关的数据库操作，包括教练信息管理、评价管理等
 */
export class CoachManager {
  /**
   * 创建教练档案
   * @param data 教练数据（必须包含userId等字段）
   * @returns 创建的教练对象
   */
  async createCoach(data: InsertCoach): Promise<Coach> {
    const validated = insertCoachSchema.parse(data);
    const [coach] = await db.insert(coaches).values(validated).returning();
    return coach;
  }

  /**
   * 获取教练列表
   * @param options 查询选项
   *   - skip: 跳过的记录数（用于分页）
   *   - limit: 返回的记录数
   *   - filters: 过滤条件（id、userId、status）
   * @returns 教练列表，按平均评分降序排列
   */
  async getCoaches(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Coach, "id" | "userId" | "status">>;
  } = {}): Promise<Coach[]> {
    const { skip = 0, limit = 100, filters = {} } = options;

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(coaches.id, filters.id));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(coaches.userId, filters.userId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(coaches.status, filters.status));
    }

    const query = db.select().from(coaches).limit(limit).offset(skip);

    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(coaches.averageRating));
    }

    return query.orderBy(desc(coaches.averageRating));
  }

  /**
   * 根据ID获取教练
   * @param id 教练ID
   * @returns 教练对象，不存在则返回null
   */
  async getCoachById(id: string): Promise<Coach | null> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach || null;
  }

  /**
   * 根据用户ID获取教练
   * @param userId 关联的用户ID
   * @returns 教练对象，不存在则返回null
   */
  async getCoachByUserId(userId: string): Promise<Coach | null> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.userId, userId));
    return coach || null;
  }

  /**
   * 更新教练信息
   * @param id 教练ID
   * @param data 要更新的数据（部分字段）
   * @returns 更新后的教练对象，失败则返回null
   */
  async updateCoach(id: string, data: UpdateCoach): Promise<Coach | null> {
    const validated = updateCoachSchema.parse(data);
    const [coach] = await db
      .update(coaches)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(coaches.id, id))
      .returning();
    return coach || null;
  }

  /**
   * 删除教练
   * @param id 教练ID
   * @returns 是否删除成功
   */
  async deleteCoach(id: string): Promise<boolean> {
    const result = await db.delete(coaches).where(eq(coaches.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取已审核通过的教练列表（带用户信息）
   * @returns 包含教练和关联用户信息的教练列表，按平均评分降序排列
   */
  async getApprovedCoachesWithUser(): Promise<any[]> {
    const results = await db
      .select({
        id: coaches.id,
        userId: coaches.userId,
        status: coaches.status,
        experienceYears: coaches.experienceYears,
        certifications: coaches.certifications,
        specialties: coaches.specialties,
        teachingStyle: coaches.teachingStyle,
        teachingAreas: coaches.teachingAreas,
        hourlyRate: coaches.hourlyRate,
        totalLessons: coaches.totalLessons,
        averageRating: coaches.averageRating,
        reviewCount: coaches.reviewCount,
        availableDays: coaches.availableDays,
        availableTimeSlots: coaches.availableTimeSlots,
        bankInfo: coaches.bankInfo,
        createdAt: coaches.createdAt,
        updatedAt: coaches.updatedAt,
        userName: users.name,
        userAvatar: users.avatar,
      })
      .from(coaches)
      .innerJoin(users, eq(coaches.userId, users.id))
      .where(eq(coaches.status, "approved"))
      .orderBy(desc(coaches.averageRating))
      .limit(100);

    return results;
  }

  /**
   * 更新教练统计数据（课程数、平均评分等）
   * @param coachId 教练ID
   */
  async updateCoachStats(coachId: string): Promise<void> {
    // 计算平均评分
    const reviews = await db
      .select()
      .from(coachReviews)
      .where(eq(coachReviews.coachId, coachId));

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = (totalRating / reviews.length).toFixed(2);

      await db
        .update(coaches)
        .set({
          averageRating: averageRating,
          reviewCount: reviews.length,
          updatedAt: new Date(),
        })
        .where(eq(coaches.id, coachId));
    }
  }

  // ==================== 教练评价相关 ====================

  /**
   * 创建教练评价
   * @param data 评价数据（必须包含coachId、userId、rating、comment等）
   * @returns 创建的评价对象
   */
  async createCoachReview(data: InsertCoachReview): Promise<CoachReview> {
    const validated = insertCoachReviewSchema.parse(data);
    const [review] = await db.insert(coachReviews).values(validated).returning();

    // 更新教练统计
    await this.updateCoachStats(data.coachId);

    return review;
  }

  /**
   * 获取教练的评价列表
   * @param coachId 教练ID
   * @param options 查询选项（skip、limit）
   * @returns 评价列表，按创建时间升序排列
   */
  async getCoachReviews(coachId: string, options: { skip?: number; limit?: number } = {}): Promise<CoachReview[]> {
    const { skip = 0, limit = 50 } = options;

    return db
      .select()
      .from(coachReviews)
      .where(eq(coachReviews.coachId, coachId))
      .orderBy(coachReviews.createdAt)
      .limit(limit)
      .offset(skip);
  }

  /**
   * 获取用户的评价列表
   * @param userId 用户ID
   * @returns 用户创建的评价列表，按创建时间升序排列
   */
  async getCoachReviewsByUser(userId: string): Promise<CoachReview[]> {
    return db
      .select()
      .from(coachReviews)
      .where(eq(coachReviews.userId, userId))
      .orderBy(coachReviews.createdAt);
  }

  /**
   * 删除教练评价
   * @param id 评价ID
   * @returns 是否删除成功
   */
  async deleteCoachReview(id: string): Promise<boolean> {
    const [review] = await db.select().from(coachReviews).where(eq(coachReviews.id, id));
    if (review) {
      await db.delete(coachReviews).where(eq(coachReviews.id, id));
      await this.updateCoachStats(review.coachId);
      return true;
    }
    return false;
  }

  /**
   * 别名方法：create（兼容旧API）
   * @param data 教练数据
   * @returns 创建的教练对象
   */
  async create(data: InsertCoach): Promise<Coach> {
    return this.createCoach(data);
  }

  /**
   * 别名方法：update（兼容旧API）
   */
  async update(id: string, data: UpdateCoach): Promise<Coach | null> {
    return this.updateCoach(id, data);
  }

  /**
   * 别名方法：findByIdWithDetails（兼容旧API）
   * 优化：使用单次查询获取教练详情和用户信息，避免N+1问题
   */
  async findByIdWithDetails(id: string) {
    // 使用JOIN一次性获取教练和用户信息
    const [result] = await db
      .select({
        coach: coaches,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          phone: users.phone,
        },
      })
      .from(coaches)
      .leftJoin(users, eq(coaches.userId, users.id))
      .where(eq(coaches.id, id));

    if (!result) return null;

    // 单独获取评价（评价通常较多，保持单独查询但限制数量）
    const reviews = await db
      .select()
      .from(coachReviews)
      .where(eq(coachReviews.coachId, id))
      .orderBy(desc(coachReviews.createdAt))
      .limit(20);

    return {
      ...result.coach,
      user: result.user,
      reviews,
    };
  }

  /**
   * 别名方法：findApproved（兼容旧API）
   */
  async findApproved(filters: any = {}) {
    return this.getCoaches({
      filters: { status: 'approved' },
    });
  }

  /**
   * 获取教练总数（用于分页）
   * @param filters 过滤条件
   * @returns 符合条件的教练总数
   */
  async getCoachesCount(filters: Partial<Pick<Coach, "status">> = {}): Promise<number> {
    const conditions: SQL[] = [];
    
    if (filters.status !== undefined) {
      conditions.push(eq(coaches.status, filters.status));
    }
    
    const query = db.select({ count: sql<number>`count(*)` }).from(coaches);
    
    const [result] = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;
    
    return result?.count || 0;
  }

  /**
   * 别名方法：getReviews（兼容旧API）
   */
  async getReviews(coachId: string, page: number = 1, limit: number = 10): Promise<CoachReview[]> {
    return this.getCoachReviews(coachId, {
      skip: (page - 1) * limit,
      limit,
    });
  }

  /**
   * 别名方法：addReview（兼容旧API）
   */
  async addReview(data: InsertCoachReview): Promise<CoachReview> {
    return this.createCoachReview(data);
  }

  /**
   * 别名方法：approve（兼容旧API）
   */
  async approve(id: string, status: string, reason?: string) {
    return this.updateCoach(id, { status: status as any });
  }

  /**
   * 别名方法：findByUserId（兼容旧API）
   */
  async findByUserId(userId: string): Promise<Coach | null> {
    const [coach] = await this.getCoaches({ filters: { userId } });
    return coach || null;
  }
}

export const coachManager = new CoachManager();
