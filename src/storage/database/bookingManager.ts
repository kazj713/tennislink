import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  bookings,
  insertBookingSchema,
  updateBookingSchema,
  courses,
  coaches,
  users,
} from "./shared/schema";
import { chatManager } from "./chatManager";
import { profitSharingManager } from "./profitSharingManager";
import type {
  Booking,
  InsertBooking,
  UpdateBooking,
} from "./shared/schema";

/**
 * 预约管理器
 * 负责课程预约相关的数据库操作，包括预约创建、查询、更新、删除等
 * 在创建预约时自动创建聊天室
 */
export class BookingManager {
  /**
   * 创建课程预约
   * @param data 预约数据（必须包含courseId、userId、coachId、scheduledDate等字段）
   * @returns 创建的预约对象
   */
  async createBooking(data: InsertBooking): Promise<Booking> {
    const db = await getDb();
    const validated = insertBookingSchema.parse(data);
    const [booking] = await db.insert(bookings).values(validated).returning();

    // 更新教练的课程总数
    await db
      .update(coaches)
      .set({
        totalLessons: sql`${coaches.totalLessons} + 1`,
      })
      .where(eq(coaches.id, data.coachId));

    // 自动创建聊天室（如果该课程还没有聊天室）
    const existingRoom = await chatManager.getChatRoomByCourseId(data.courseId);
    if (!existingRoom) {
      // 获取课程信息用于命名聊天室
      const [course] = await db
        .select({ title: courses.title })
        .from(courses)
        .where(eq(courses.id, data.courseId))
        .limit(1);

      const roomName = course ? `${course.title} 聊天室` : "课程聊天室";
      await chatManager.createChatRoom({
        courseId: data.courseId,
        bookingId: booking.id,
        name: roomName,
        type: "private",
      });
      console.log(`课程 ${data.courseId} 创建聊天室成功`);
    }

    return booking;
  }

  /**
   * 获取预约列表
   * @param options 查询选项
   *   - skip: 跳过的记录数（用于分页）
   *   - limit: 返回的记录数
   *   - filters: 过滤条件（id、courseId、userId、coachId、status、paymentStatus）
   * @returns 预约列表，按预约时间降序排列
   */
  async getBookings(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<
      Pick<Booking, "id" | "courseId" | "userId" | "coachId" | "status" | "paymentStatus">
    >;
  } = {}): Promise<Booking[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(bookings.id, filters.id));
    }
    if (filters.courseId !== undefined) {
      conditions.push(eq(bookings.courseId, filters.courseId));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(bookings.userId, filters.userId));
    }
    if (filters.coachId !== undefined) {
      conditions.push(eq(bookings.coachId, filters.coachId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(bookings.status, filters.status));
    }
    if (filters.paymentStatus !== undefined) {
      conditions.push(eq(bookings.paymentStatus, filters.paymentStatus));
    }

    const query = db
      .select()
      .from(bookings)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(bookings.scheduledDate));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  /**
   * 根据ID获取预约
   * @param id 预约ID
   * @returns 预约对象，不存在则返回null
   */
  async getBookingById(id: string): Promise<Booking | null> {
    const db = await getDb();
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || null;
  }

  /**
   * 更新预约信息
   * @param id 预约ID
   * @param data 要更新的数据（部分字段）
   * @returns 更新后的预约对象，失败则返回null
   */
  async updateBooking(id: string, data: UpdateBooking): Promise<Booking | null> {
    const db = await getDb();
    const validated = updateBookingSchema.parse(data);
    const [booking] = await db
      .update(bookings)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || null;
  }

  /**
   * 删除预约
   * @param id 预约ID
   * @returns 是否删除成功
   */
  async deleteBooking(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取用户的课程预约（带课程和教练信息）
   * @param userId 用户ID
   * @returns 包含预约详情、课程标题、教练信息的预约列表
   */
  async getUserBookingsWithDetails(userId: string): Promise<any[]> {
    const db = await getDb();
    const results = await db
      .select({
        id: bookings.id,
        courseId: bookings.courseId,
        userId: bookings.userId,
        coachId: bookings.coachId,
        scheduledDate: bookings.scheduledDate,
        duration: bookings.duration,
        status: bookings.status,
        notes: bookings.notes,
        paymentStatus: bookings.paymentStatus,
        paymentAmount: bookings.paymentAmount,
        transactionId: bookings.transactionId,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        courseTitle: courses.title,
        coachName: users.name,
        coachAvatar: users.avatar,
      })
      .from(bookings)
      .innerJoin(courses, eq(bookings.courseId, courses.id))
      .innerJoin(coaches, eq(bookings.coachId, coaches.id))
      .innerJoin(users, eq(coaches.userId, users.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.scheduledDate))
      .limit(100);

    return results;
  }

  /**
   * 获取教练的课程预约（带用户信息）
   * @param coachId 教练ID
   * @returns 包含预约详情、课程标题、用户信息的预约列表
   */
  async getCoachBookingsWithDetails(coachId: string): Promise<any[]> {
    const db = await getDb();
    const results = await db
      .select({
        id: bookings.id,
        courseId: bookings.courseId,
        userId: bookings.userId,
        coachId: bookings.coachId,
        scheduledDate: bookings.scheduledDate,
        duration: bookings.duration,
        status: bookings.status,
        notes: bookings.notes,
        paymentStatus: bookings.paymentStatus,
        paymentAmount: bookings.paymentAmount,
        transactionId: bookings.transactionId,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        courseTitle: courses.title,
        userName: users.name,
        userAvatar: users.avatar,
      })
      .from(bookings)
      .innerJoin(courses, eq(bookings.courseId, courses.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.coachId, coachId))
      .orderBy(desc(bookings.scheduledDate))
      .limit(100);

    return results;
  }

  /**
   * 获取即将到来的预约
   * @param userId 用户ID
   * @param limit 返回记录数限制
   * @returns 用户未来的预约列表
   */
  async getUpcomingBookings(userId: string, limit: number = 10): Promise<Booking[]> {
    const db = await getDb();
    const now = new Date();
    return db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.status, "confirmed"),
          sql`${bookings.scheduledDate} >= ${now}`
        )
      )
      .orderBy(bookings.scheduledDate)
      .limit(limit);
  }

  /**
   * 根据教练ID和日期获取预约
   * @param coachId 教练ID
   * @param date 日期（YYYY-MM-DD格式）
   * @returns 该教练在指定日期的所有预约
   */
  async getBookingsByCoachAndDate(coachId: string, date: string): Promise<Booking[]> {
    const db = await getDb();
    
    // 解析日期，获取当天的开始和结束时间
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.coachId, coachId),
          eq(bookings.status, "confirmed"),
          sql`${bookings.scheduledDate} BETWEEN ${startDate} AND ${endDate}`
        )
      )
      .orderBy(bookings.scheduledDate);
  }

  /**
   * 完成课程预约
   * @param bookingId 预约ID
   * @returns 更新后的预约对象，失败则返回null
   */
  async completeBooking(bookingId: string): Promise<Booking | null> {
    return this.updateBooking(bookingId, { status: "completed" });
  }

  /**
   * 处理支付
   * @param bookingId 预约ID
   * @param transactionId 交易ID
   * @returns 更新后的预约对象，失败则返回null
   */
  async processPayment(bookingId: string, transactionId: string): Promise<Booking | null> {
    const db = await getDb();
    
    // 获取预约信息
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      return null;
    }
    
    // 更新预约状态
    const updatedBooking = await this.updateBooking(bookingId, { 
      paymentStatus: "paid",
      transactionId 
    });
    
    if (updatedBooking) {
      // 尝试创建分账记录
      try {
        // 获取教练信息
        const [coach] = await db
          .select({ userId: coaches.userId })
          .from(coaches)
          .where(eq(coaches.id, booking.coachId))
          .limit(1);
        
        if (coach) {
          // 查找教练对应的分账接收方
          const recipient = await profitSharingManager.getProfitSharingRecipientByUserId(coach.userId);
          
          if (recipient) {
            // 计算分账金额（假设分账比例为80%）
            const paymentAmount = parseFloat(booking.paymentAmount || "0");
            const profitSharingAmount = profitSharingManager.calculateProfitSharingAmount(
              paymentAmount,
              80 // 80%的分账比例
            );
            
            // 创建分账记录
            await profitSharingManager.createProfitSharingRecord({
              bookingId: booking.id,
              transactionId,
              amount: profitSharingAmount.toString(),
              recipientId: recipient.id,
              status: "pending",
              type: "course",
              notes: `课程预约分账: ${booking.id}`,
            });
            
            console.log(`预约 ${booking.id} 支付成功，已创建分账记录`);
          } else {
            console.log(`教练 ${booking.coachId} 未设置分账接收方`);
          }
        }
      } catch (error) {
        console.error(`创建分账记录失败: ${error}`);
        // 分账失败不影响支付流程
      }
    }
    
    return updatedBooking;
  }
}

export const bookingManager = new BookingManager();
