import { eq, and, SQL, desc, like, or, sql } from "drizzle-orm";
import { getDb } from "./instance";
import {
  courses,
  insertCourseSchema,
  updateCourseSchema,
  coaches,
  users,
} from "./shared/schema";
import type {
  Course,
  InsertCourse,
  UpdateCourse,
} from "./shared/schema";

/**
 * 课程管理器
 * 负责课程相关的数据库操作，包括课程创建、查询、更新、删除等
 */
export class CourseManager {
  /**
   * 创建课程
   * @param data 课程数据（必须包含coachId、title、type、duration、price等字段）
   * @returns 创建的课程对象
   */
  async createCourse(data: InsertCourse): Promise<Course> {
    const db = await getDb();
    const validated = insertCourseSchema.parse(data);
    const [course] = await db.insert(courses).values(validated).returning();
    return course;
  }

  /**
   * 获取课程列表
   * @param options 查询选项
   *   - skip: 跳过的记录数（用于分页）
   *   - limit: 返回的记录数
   *   - filters: 过滤条件（id、coachId、type、level、isPublic）
   *   - searchKeyword: 搜索关键词（模糊匹配标题或描述）
   * @returns 课程列表，按创建时间降序排列
   */
  async getCourses(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<
      Pick<Course, "id" | "coachId" | "type" | "level" | "isPublic">
    >;
    searchKeyword?: string; // 搜索标题或描述
  } = {}): Promise<Course[]> {
    const { skip = 0, limit = 100, filters = {}, searchKeyword } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(courses.id, filters.id));
    }
    if (filters.coachId !== undefined) {
      conditions.push(eq(courses.coachId, filters.coachId));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(courses.type, filters.type));
    }
    if (filters.level !== undefined && filters.level !== null) {
      conditions.push(eq(courses.level, filters.level));
    }
    if (filters.isPublic !== undefined) {
      conditions.push(eq(courses.isPublic, filters.isPublic));
    }

    // 搜索关键词（标题或描述）
    if (searchKeyword) {
      conditions.push(
        or(
          like(courses.title, `%${searchKeyword}%`),
          like(courses.description || "", `%${searchKeyword}%`)
        )!
      );
    }

    const query = db.select().from(courses).limit(limit).offset(skip);

    if (conditions.length > 0) {
      return query.where(and(...conditions)).orderBy(desc(courses.createdAt));
    }

    return query.orderBy(desc(courses.createdAt));
  }

  /**
   * 根据ID获取课程
   * @param id 课程ID
   * @returns 课程对象，不存在则返回null
   */
  async getCourseById(id: string): Promise<Course | null> {
    const db = await getDb();
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || null;
  }

  /**
   * 更新课程信息
   * @param id 课程ID
   * @param data 要更新的数据（部分字段）
   * @returns 更新后的课程对象，失败则返回null
   */
  async updateCourse(id: string, data: UpdateCourse): Promise<Course | null> {
    const db = await getDb();
    const validated = updateCourseSchema.parse(data);
    const [course] = await db
      .update(courses)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course || null;
  }

  /**
   * 删除课程
   * @param id 课程ID
   * @returns 是否删除成功
   */
  async deleteCourse(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(courses).where(eq(courses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取公开课程列表（带教练信息）
   * @returns 包含课程和关联教练信息的公开课程列表，仅返回已审核教练的课程
   */
  async getPublicCoursesWithCoach(): Promise<any[]> {
    const db = await getDb();
    const results = await db
      .select({
        id: courses.id,
        coachId: courses.coachId,
        type: courses.type,
        title: courses.title,
        description: courses.description,
        duration: courses.duration,
        maxStudents: courses.maxStudents,
        price: courses.price,
        level: courses.level,
        tags: courses.tags,
        isPublic: courses.isPublic,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        coachName: users.name,
        coachAvatar: users.avatar,
      })
      .from(courses)
      .innerJoin(coaches, eq(courses.coachId, coaches.id))
      .innerJoin(users, eq(coaches.userId, users.id))
      .where(and(eq(courses.isPublic, true), eq(coaches.status, "approved")))
      .orderBy(desc(courses.createdAt))
      .limit(100);

    return results;
  }

  /**
   * 根据教练ID获取课程
   * @param coachId 教练ID
   * @returns 该教练的课程列表，按创建时间降序排列
   */
  async getCoursesByCoachId(coachId: string): Promise<Course[]> {
    const db = await getDb();
    return db
      .select()
      .from(courses)
      .where(eq(courses.coachId, coachId))
      .orderBy(desc(courses.createdAt));
  }

  /**
   * 获取课程总数（用于分页）
   * @param filters 过滤条件
   * @returns 符合条件的课程总数
   */
  async getCoursesCount(filters: Partial<
    Pick<Course, "id" | "coachId" | "type" | "level" | "isPublic">
  > & { searchKeyword?: string } = {}): Promise<number> {
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(courses.id, filters.id));
    }
    if (filters.coachId !== undefined) {
      conditions.push(eq(courses.coachId, filters.coachId));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(courses.type, filters.type));
    }
    if (filters.level !== undefined && filters.level !== null) {
      conditions.push(eq(courses.level, filters.level));
    }
    if (filters.isPublic !== undefined) {
      conditions.push(eq(courses.isPublic, filters.isPublic));
    }
    if (filters.searchKeyword) {
      conditions.push(
        or(
          like(courses.title, `%${filters.searchKeyword}%`),
          like(courses.description || "", `%${filters.searchKeyword}%`)
        )!
      );
    }

    const query = db.select({ count: sql<number>`count(*)` }).from(courses);

    const [result] = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    return result?.count || 0;
  }
}

export const courseManager = new CourseManager();
