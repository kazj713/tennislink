import { eq, and, SQL, like, or, desc, sql } from "drizzle-orm";
import { db } from "./instance";
import {
  venues,
  insertVenueSchema,
  updateVenueSchema,
  venueSlots,
  insertVenueSlotSchema,
  updateVenueSlotSchema,
  venueBookings,
  insertVenueBookingSchema,
  updateVenueBookingSchema,
} from "./shared/schema";
import { profitSharingManager } from "./profitSharingManager";
import type {
  Venue,
  InsertVenue,
  UpdateVenue,
  VenueSlot,
  InsertVenueSlot,
  UpdateVenueSlot,
  VenueBooking,
  InsertVenueBooking,
  UpdateVenueBooking,
} from "./shared/schema";

/**
 * 场地管理器
 * 负责场地、场地时段、场地预约相关的数据库操作
 */
export class VenueManager {
  /**
   * 创建场地
   * @param data 场地数据（必须包含name、city、address等字段）
   * @returns 创建的场地对象
   */
  async createVenue(data: InsertVenue): Promise<Venue> {
    const validated = insertVenueSchema.parse(data);
    const [venue] = await db.insert(venues).values(validated).returning();
    return venue;
  }

  async getVenues(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Venue, "id" | "city" | "type" | "isActive">>;
    searchKeyword?: string;
  } = {}): Promise<Venue[]> {
    
    // 简化版本，直接返回所有场地（适用于管理员界面）
    const allVenues = await db.select().from(venues).orderBy(desc(venues.createdAt));
    return allVenues;
  }

  async getVenuesAdvanced(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Venue, "id" | "city" | "type" | "isActive">>;
    searchKeyword?: string;
  } = {}): Promise<Venue[]> {
    const { skip = 0, limit = 100, filters = {}, searchKeyword } = options;

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(venues.id, filters.id));
    }
    if (filters.city !== undefined) {
      conditions.push(eq(venues.city, filters.city));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(venues.type, filters.type));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(venues.isActive, filters.isActive));
    }

    if (searchKeyword) {
      conditions.push(
        or(
          like(venues.name, `%${searchKeyword}%`),
          like(venues.address || "", `%${searchKeyword}%`),
          like(venues.district || "", `%${searchKeyword}%`)
        )!
      );
    }

    const query = db.select().from(venues).limit(limit).offset(skip);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  async getVenueById(id: string): Promise<Venue | null> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue || null;
  }

  async updateVenue(id: string, data: UpdateVenue): Promise<Venue | null> {
    const validated = updateVenueSchema.parse(data);
    const [venue] = await db
      .update(venues)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(venues.id, id))
      .returning();
    return venue || null;
  }

  async deleteVenue(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const venue = await this.getVenueById(id);

      if (!venue) {
        return {
          success: false,
          message: "场地不存在",
        };
      }

      const activeBookings = await db
        .select()
        .from(venueBookings)
        .where(
          and(
            eq(venueBookings.venueId, id),
            sql`${venueBookings.status} NOT IN ('cancelled', 'completed')`
          )
        );

      if (activeBookings.length > 0) {
        return {
          success: false,
          message: `该场地存在 ${activeBookings.length} 个未完成的预约，请先取消这些预约后再删除场地`,
        };
      }

      await db.delete(venues).where(eq(venues.id, id));

      return {
        success: true,
        message: "场地已成功删除",
      };
    } catch (error) {
      console.error("Delete venue error:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      if (errorMessage.includes("foreign key constraint")) {
        return {
          success: false,
          message: "删除失败：存在关联数据无法自动清理，请联系管理员",
        };
      }
      return {
        success: false,
        message: `删除失败：${errorMessage}`,
      };
    }
  }

  // ==================== 场地时段相关 ====================

  async createVenueSlot(data: InsertVenueSlot): Promise<VenueSlot> {
    const validated = insertVenueSlotSchema.parse(data);
    const [slot] = await db.insert(venueSlots).values(validated).returning();
    return slot;
  }

  async getVenueSlots(
    venueId: string,
    date: Date,
    options: { skip?: number; limit?: number } = {}
  ): Promise<VenueSlot[]> {
    const { skip = 0, limit = 100 } = options;

    return db
      .select()
      .from(venueSlots)
      .where(
        and(
          eq(venueSlots.venueId, venueId),
          sql`date(${venueSlots.date}) = ${date.toISOString().split('T')[0]}`
        )
      )
      .orderBy(venueSlots.startTime)
      .limit(limit)
      .offset(skip);
  }

  async updateVenueSlot(id: string, data: UpdateVenueSlot): Promise<VenueSlot | null> {
    const validated = updateVenueSlotSchema.parse(data);
    const [slot] = await db.update(venueSlots).set(validated).where(eq(venueSlots.id, id)).returning();
    return slot || null;
  }

  async deleteVenueSlot(id: string): Promise<boolean> {
    const result = await db.delete(venueSlots).where(eq(venueSlots.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取场地的可用时段
   */
  async getAvailableSlots(venueId: string, date: Date): Promise<VenueSlot[]> {
    return db
      .select()
      .from(venueSlots)
      .where(
        and(
          eq(venueSlots.venueId, venueId),
          eq(venueSlots.isAvailable, true),
          sql`date(${venueSlots.date}) = ${date.toISOString().split('T')[0]}`
        )
      )
      .orderBy(venueSlots.startTime);
  }

  // ==================== 场地预约相关 ====================

  async createVenueBooking(data: InsertVenueBooking): Promise<VenueBooking> {
    const validated = insertVenueBookingSchema.parse(data);

    // 创建预约
    const [booking] = await db.insert(venueBookings).values(validated).returning();

    // 标记时段为不可用
    await db.update(venueSlots).set({ isAvailable: false }).where(eq(venueSlots.id, data.slotId));

    return booking;
  }

  async getVenueBookings(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<
      Pick<VenueBooking, "id" | "venueId" | "slotId" | "userId" | "status" | "paymentStatus">
    >;
  } = {}): Promise<VenueBooking[]> {
    const { skip = 0, limit = 100, filters = {} } = options;

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(venueBookings.id, filters.id));
    }
    if (filters.venueId !== undefined) {
      conditions.push(eq(venueBookings.venueId, filters.venueId));
    }
    if (filters.slotId !== undefined) {
      conditions.push(eq(venueBookings.slotId, filters.slotId));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(venueBookings.userId, filters.userId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(venueBookings.status, filters.status));
    }
    if (filters.paymentStatus !== undefined) {
      conditions.push(eq(venueBookings.paymentStatus, filters.paymentStatus));
    }

    const query = db
      .select()
      .from(venueBookings)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(venueBookings.bookingDate));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  async getVenueBookingById(id: string): Promise<VenueBooking | null> {
    const [booking] = await db.select().from(venueBookings).where(eq(venueBookings.id, id));
    return booking || null;
  }

  async updateVenueBooking(id: string, data: UpdateVenueBooking): Promise<VenueBooking | null> {
    const validated = updateVenueBookingSchema.parse(data);
    const [booking] = await db
      .update(venueBookings)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(venueBookings.id, id))
      .returning();
    return booking || null;
  }

  async deleteVenueBooking(id: string): Promise<boolean> {
    const [booking] = await db.select().from(venueBookings).where(eq(venueBookings.id, id));

    if (booking) {
      await db.delete(venueBookings).where(eq(venueBookings.id, id));
      // 释放时段
      await db.update(venueSlots).set({ isAvailable: true }).where(eq(venueSlots.id, booking.slotId));
      return true;
    }

    return false;
  }

  /**
   * 取消场地预约
   */
  async cancelVenueBooking(id: string): Promise<boolean> {
    const [booking] = await db.select().from(venueBookings).where(eq(venueBookings.id, id));

    if (booking && booking.status !== "cancelled") {
      await db
        .update(venueBookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(venueBookings.id, id));
      // 释放时段
      await db.update(venueSlots).set({ isAvailable: true }).where(eq(venueSlots.id, booking.slotId));
      return true;
    }

    return false;
  }

  /**
   * 处理场地预约支付
   * @param bookingId 场地预约ID
   * @param transactionId 交易ID
   * @returns 更新后的场地预约对象，失败则返回null
   */
  async processVenueBookingPayment(bookingId: string, transactionId: string): Promise<VenueBooking | null> {
    // 获取场地预约信息
    const booking = await this.getVenueBookingById(bookingId);
    if (!booking) {
      return null;
    }
    
    // 更新预约状态
    const updatedBooking = await this.updateVenueBooking(bookingId, { 
      paymentStatus: "paid",
      transactionId 
    });
    
    if (updatedBooking) {
      // 尝试创建分账记录
      try {
        // 查找场地对应的分账接收方
        // 这里假设场地有对应的管理员或所有者
        // 实际实现中可能需要根据具体业务逻辑获取
        
        // 计算分账金额（假设分账比例为70%）
        const paymentAmount = parseFloat(booking.paymentAmount || "0");
        const profitSharingAmount = profitSharingManager.calculateProfitSharingAmount(
          paymentAmount,
          70 // 70%的分账比例
        );
        
        // 这里需要根据实际业务逻辑获取分账接收方
        // 例如，可能需要从场地信息中获取管理员ID，然后查找对应的分账接收方
        
        // 暂时注释掉分账记录创建，需要根据实际业务逻辑完善
        // await profitSharingManager.createProfitSharingRecord({
        //   venueBookingId: booking.id,
        //   transactionId,
        //   amount: profitSharingAmount,
        //   recipientId: recipient.id,
        //   status: "pending",
        //   type: "venue",
        //   notes: `场地预约分账: ${booking.id}`,
        // });
        
        console.log(`场地预约 ${booking.id} 支付成功`);
      } catch (error) {
        console.error(`创建场地预约分账记录失败: ${error}`);
        // 分账失败不影响支付流程
      }
    }
    
    return updatedBooking;
  }
}

export const venueManager = new VenueManager();
