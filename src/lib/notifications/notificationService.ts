import { db } from "@/storage/database/instance";
import { notifications, InsertNotification } from "@/storage/database/shared/schema";
import { eq, and, or, lt, count } from "drizzle-orm";

class NotificationService {
  /**
   * 创建新通知
   */
  async createNotification(data: InsertNotification): Promise<InsertNotification> {
    try {
      const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning()
        .execute();
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * 批量创建通知
   */
  async createBatchNotifications(notificationList: InsertNotification[]): Promise<InsertNotification[]> {
    if (notificationList.length === 0) {
      return [];
    }

    try {
      const createdNotifications = await db
        .insert(notifications)
        .values(notificationList)
        .returning()
        .execute();
      return createdNotifications;
    } catch (error) {
      console.error("Error creating batch notifications:", error);
      throw error;
    }
  }

  /**
   * 创建系统通知
   */
  async createSystemNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<InsertNotification> {
    return this.createNotification({
      userId,
      type: "system",
      title,
      message,
      status: "unread",
      actionUrl,
    });
  }

  /**
   * 创建预约相关通知
   */
  async createBookingNotification(
    userId: string,
    title: string,
    message: string,
    bookingId: string,
    actionUrl?: string
  ): Promise<InsertNotification> {
    return this.createNotification({
      userId,
      type: "booking",
      title,
      message,
      status: "unread",
      relatedId: bookingId,
      relatedType: "booking",
      actionUrl,
    });
  }

  /**
   * 创建教练评价通知
   */
  async createCoachReviewNotification(
    userId: string,
    title: string,
    message: string,
    coachId: string,
    actionUrl?: string
  ): Promise<InsertNotification> {
    return this.createNotification({
      userId,
      type: "coach_review",
      title,
      message,
      status: "unread",
      relatedId: coachId,
      relatedType: "coach",
      actionUrl,
    });
  }

  /**
   * 创建约球相关通知
   */
  async createMatchupNotification(
    userId: string,
    title: string,
    message: string,
    matchupId: string,
    actionUrl?: string
  ): Promise<InsertNotification> {
    return this.createNotification({
      userId,
      type: "matchup",
      title,
      message,
      status: "unread",
      relatedId: matchupId,
      relatedType: "matchup",
      actionUrl,
    });
  }

  /**
   * 创建赛事相关通知
   */
  async createTournamentNotification(
    userId: string,
    title: string,
    message: string,
    tournamentId: string,
    actionUrl?: string
  ): Promise<InsertNotification> {
    return this.createNotification({
      userId,
      type: "tournament",
      title,
      message,
      status: "unread",
      relatedId: tournamentId,
      relatedType: "tournament",
      actionUrl,
    });
  }

  /**
   * 创建支付相关通知
   */
  async createPaymentNotification(
    userId: string,
    title: string,
    message: string,
    transactionId: string,
    actionUrl?: string
  ): Promise<InsertNotification> {
    return this.createNotification({
      userId,
      type: "payment",
      title,
      message,
      status: "unread",
      relatedId: transactionId,
      relatedType: "payment",
      actionUrl,
    });
  }

  /**
   * 创建VIP会员相关通知
   */
  async createVipNotification(
    userId: string,
    title: string,
    message: string,
    subscriptionId: string,
    actionUrl?: string
  ): Promise<InsertNotification> {
    return this.createNotification({
      userId,
      type: "vip",
      title,
      message,
      status: "unread",
      relatedId: subscriptionId,
      relatedType: "vip_subscription",
      actionUrl,
    });
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ status: "read" })
        .where(eq(notifications.id, notificationId))
        .execute();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * 标记用户所有通知为已读
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ status: "read" })
        .where(and(eq(notifications.userId, userId), eq(notifications.status, "unread")))
        .execute();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * 获取用户未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.status, "unread")))
        .execute();
      return result?.count || 0;
    } catch (error) {
      console.error("Error getting unread notification count:", error);
      return 0;
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, notificationId))
        .execute();
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * 清理用户的旧通知
   */
  async cleanUpOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            lt(notifications.createdAt, cutoffDate),
            or(
              eq(notifications.status, "read"),
              eq(notifications.status, "archived")
            )
          )
        )
        .execute();
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }
}



export const notificationService = new NotificationService();
export default notificationService;