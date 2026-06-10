import { eq, and, SQL, like, or, sql } from "drizzle-orm";
import { getDb } from "./instance";
import { users, insertUserSchema, updateUserSchema } from "./shared/schema";
import type { User, InsertUser, UpdateUser } from "./shared/schema";

/**
 * 根据邮箱获取用户（独立导出函数）
 * @param email 用户邮箱
 * @returns 用户对象，不存在则返回null
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

/**
 * 根据微信OpenID获取用户（独立导出函数）
 * @param openid 微信OpenID
 * @returns 用户对象，不存在则返回null
 */
export async function getUserByOpenid(openid: string): Promise<User | null> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.wechatOpenid, openid));
  return user || null;
}

/**
 * 用户管理器
 * 负责用户相关的数据库操作，包括用户创建、查询、更新、删除等
 */
export class UserManager {
  /**
   * 创建新用户
   * @param data 用户数据（必须包含name、email、password等字段）
   * @returns 创建的用户对象
   */
  async createUser(data: InsertUser): Promise<User> {
    const db = await getDb();
    const validated = insertUserSchema.parse(data);
    const [user] = await db.insert(users).values(validated).returning();
    return user;
  }

  /**
   * 获取用户列表
   * @param options 查询选项
   *   - skip: 跳过的记录数（用于分页）
   *   - limit: 返回的记录数
   *   - filters: 过滤条件（id、name、email、role、isActive、city、skillLevel）
   *   - searchKeyword: 搜索关键词（模糊匹配姓名或邮箱）
   * @returns 用户列表
   */
  async getUsers(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<
      Pick<User, "id" | "name" | "email" | "role" | "isActive" | "city" | "skillLevel">
    >;
    searchKeyword?: string; // 用于搜索姓名或邮箱
  } = {}): Promise<User[]> {
    const { skip = 0, limit = 100, filters = {}, searchKeyword } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    // 显式字段判断
    if (filters.id !== undefined) {
      conditions.push(eq(users.id, filters.id));
    }
    if (filters.name !== undefined) {
      conditions.push(eq(users.name, filters.name));
    }
    if (filters.email !== undefined) {
      conditions.push(eq(users.email, filters.email));
    }
    if (filters.role !== undefined) {
      conditions.push(eq(users.role, filters.role));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }
    if (filters.city !== undefined && filters.city !== null) {
      conditions.push(eq(users.city, filters.city));
    }
    if (filters.skillLevel !== undefined && filters.skillLevel !== null) {
      conditions.push(eq(users.skillLevel, filters.skillLevel));
    }

    // 搜索关键词（姓名或邮箱）
    if (searchKeyword) {
      conditions.push(
        or(
          like(users.name, `%${searchKeyword}%`),
          like(users.email, `%${searchKeyword}%`)
        )!
      );
    }

    const query = db
      .select()
      .from(users)
      .limit(limit)
      .offset(skip);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  /**
   * 根据ID获取用户
   * @param id 用户ID
   * @returns 用户对象，不存在则返回null
   */
  async getUserById(id: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  /**
   * 根据邮箱获取用户
   * @param email 用户邮箱
   * @returns 用户对象，不存在则返回null
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  /**
   * 根据用户名获取用户
   * @param username 用户名
   * @returns 用户对象，不存在则返回null
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  /**
   * 根据手机号获取用户
   * @param phone 手机号
   * @returns 用户对象，不存在则返回null
   */
  async getUserByPhone(phone: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || null;
  }

  /**
   * 根据登录标识获取用户（支持邮箱、用户名、手机号）
   * @param identifier 登录标识（邮箱/用户名/手机号）
   * @returns 用户对象，不存在则返回null
   */
  async findByLoginIdentifier(identifier: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier),
          eq(users.username, identifier),
          eq(users.phone, identifier)
        )!
      );
    return user || null;
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param data 要更新的数据（部分字段）
   * @returns 更新后的用户对象，失败则返回null
   */
  async updateUser(id: string, data: UpdateUser): Promise<User | null> {
    const db = await getDb();
    const validated = updateUserSchema.parse(data);
    const [user] = await db
      .update(users)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 是否删除成功
   */
  async deleteUser(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取用户选项（用于下拉选择）
   * @returns 包含id、name、email、role的用户列表，仅返回激活状态的用户
   */
  async getUserOptions(): Promise<{ id: string; name: string; email: string; role: string }[]> {
    const db = await getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.name);
  }

  /**
   * 获取教练用户列表
   * @returns 角色为教练的所有用户
   */
  async getCoachUsers(): Promise<User[]> {
    const db = await getDb();
    return db.select().from(users).where(eq(users.role, 'coach'));
  }

  /**
   * 别名方法：findById（兼容旧API）
   * @param id 用户ID
   * @returns 用户对象，不存在则返回null
   */
  async findById(id: string): Promise<User | null> {
    return this.getUserById(id);
  }

  /**
   * 别名方法：findByEmail（兼容旧API）
   * @param email 用户邮箱
   * @returns 用户对象，不存在则返回null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.getUserByEmail(email);
  }

  /**
   * 别名方法：findByUsername
   * @param username 用户名
   * @returns 用户对象，不存在则返回null
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.getUserByUsername(username);
  }

  /**
   * 别名方法：findByPhone
   * @param phone 手机号
   * @returns 用户对象，不存在则返回null
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.getUserByPhone(phone);
  }

  /**
   * 别名方法：create（兼容旧API）
   * @param data 用户数据
   * @returns 创建的用户对象
   */
  async create(data: InsertUser): Promise<User> {
    return this.createUser(data);
  }

  /**
   * 别名方法：update（兼容旧API）
   * @param id 用户ID
   * @param data 要更新的数据
   * @returns 更新后的用户对象，失败则返回null
   */
  async update(id: string, data: UpdateUser): Promise<User | null> {
    return this.updateUser(id, data);
  }

  /**
   * 根据微信OpenID获取用户
   * @param openid 微信OpenID
   * @returns 用户对象，不存在则返回null
   */
  async findByWechatOpenid(openid: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.wechatOpenid, openid));
    return user || null;
  }

  /**
   * 获取学员用户列表
   */
  async getStudentUsers(): Promise<User[]> {
    const db = await getDb();
    return db
      .select()
      .from(users)
      .where(and(eq(users.role, "student"), eq(users.isActive, true)))
      .orderBy(users.createdAt);
  }

  /**
   * 封禁用户
   * @param id 用户ID
   * @returns 是否封禁成功
   */
  async banUser(id: string): Promise<boolean> {
    const result = await this.updateUser(id, { isActive: false });
    return !!result;
  }

  /**
   * 解封用户
   * @param id 用户ID
   * @returns 是否解封成功
   */
  async unbanUser(id: string): Promise<boolean> {
    const result = await this.updateUser(id, { isActive: true });
    return !!result;
  }

  /**
   * 更新教练资料
   * @param userId 用户ID
   * @param profileData 教练资料数据
   * @returns 更新后的用户对象
   */
  async updateCoachProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    return this.updateUser(userId, profileData);
  }
}

export const userManager = new UserManager();

/**
 * 更新教练资料（独立导出函数）
 * @param userId 用户ID
 * @param profileData 教练资料数据
 * @returns 更新后的用户对象
 */
export async function updateCoachProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
  return userManager.updateCoachProfile(userId, profileData);
}
