import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./instance";
import {
  refundRequests,
  paymentOrders,
  courtBookings,
} from "./shared/schema";
import type {
  RefundRequest,
  InsertRefundRequest,
} from "./shared/schema";

const REFUND_WINDOW_HOURS = 24;

export class RefundManager {
  async createRefund(data: InsertRefundRequest): Promise<RefundRequest> {
    const [refund] = await db
      .insert(refundRequests)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return refund;
  }

  async getRefundById(id: string): Promise<RefundRequest | null> {
    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.id, id));

    return refund || null;
  }

  async getUserRefunds(
    userId: string,
    options: { skip?: number; limit?: number; status?: string } = {}
  ): Promise<RefundRequest[]> {
    const { skip = 0, limit = 50, status } = options;

    const conditions: any[] = [eq(refundRequests.userId, userId)];
    if (status) {
      conditions.push(eq(refundRequests.status, status));
    }

    return db
      .select()
      .from(refundRequests)
      .where(and(...conditions))
      .limit(limit)
      .offset(skip)
      .orderBy(desc(refundRequests.createdAt));
  }

  async getAllRefunds(options: {
    skip?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<RefundRequest[]> {
    const { skip = 0, limit = 100, status } = options;

    const conditions: any[] = [];
    if (status) {
      conditions.push(eq(refundRequests.status, status));
    }

    return db
      .select()
      .from(refundRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(refundRequests.createdAt));
  }

  async reviewRefund(
    id: string,
    action: "approve" | "reject",
    adminId: string,
    adminNote?: string
  ): Promise<RefundRequest | null> {
    const updateData: any = {
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };

    if (adminNote) {
      updateData.adminNote = adminNote;
    }

    const [updated] = await db
      .update(refundRequests)
      .set(updateData)
      .where(eq(refundRequests.id, id))
      .returning();

    return updated || null;
  }

  async markAsRefunded(
    id: string,
    transactionId: string
  ): Promise<RefundRequest | null> {
    const [updated] = await db
      .update(refundRequests)
      .set({
        status: "refunded",
        refundedAt: new Date(),
        refundTransactionId: transactionId,
        updatedAt: new Date(),
      })
      .where(eq(refundRequests.id, id))
      .returning();

    return updated || null;
  }

  async canRequestRefund(
    paymentOrderId: string,
    bookingDate: string,
    bookingStartTime: string
  ): Promise<{
    canRequest: boolean;
    reason: string;
    hoursUntilBooking: number;
    isWeatherException: boolean;
  }> {
    const now = new Date();
    const bookingDateTime = new Date(`${bookingDate}T${bookingStartTime}:00`);
    const diffMs = bookingDateTime.getTime() - now.getTime();
    const hoursUntilBooking = diffMs / (1000 * 60 * 60);

    if (hoursUntilBooking <= 0) {
      return {
        canRequest: false,
        reason: "该预定已开始或已过期，无法申请退款",
        hoursUntilBooking,
        isWeatherException: false,
      };
    }

    if (hoursUntilBooking > REFUND_WINDOW_HOURS) {
      return {
        canRequest: true,
        reason: "距开场超过24小时，可申请自动退款",
        hoursUntilBooking,
        isWeatherException: false,
      };
    }

    return {
      canRequest: true,
      reason: "距开场不足24小时，仅支持恶劣天气原因申请退款（需管理员审核）",
      hoursUntilBooking,
      isWeatherException: true,
    };
  }

  async hasExistingRefund(
    userId: string,
    paymentOrderId: string
  ): Promise<RefundRequest | null> {
    const [existing] = await db
      .select()
      .from(refundRequests)
      .where(
        and(
          eq(refundRequests.userId, userId),
          eq(refundRequests.paymentOrderId, paymentOrderId),
          sql`${refundRequests.status} NOT IN ('rejected')`
        )
      )
      .limit(1);

    return existing || null;
  }
}

export const refundManager = new RefundManager();
