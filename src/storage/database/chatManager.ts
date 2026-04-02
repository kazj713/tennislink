import { getDb } from "coze-coding-dev-sdk";
import { chatRooms, chatMessages, users } from "./shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { InsertChatRoom, InsertChatMessage } from "./shared/schema";

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  messageType: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ChatRoom {
  id: string;
  courseId: string;
  bookingId: string | null;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

/**
 * 聊天室管理器
 */
export const chatManager = {
  /**
   * 创建聊天室
   */
  async createChatRoom(
    data: InsertChatRoom & { courseId: string; name: string }
  ): Promise<ChatRoom | null> {
    const db = await getDb();

    try {
      const [room] = await db
        .insert(chatRooms)
        .values({
          courseId: data.courseId,
          bookingId: data.bookingId || null,
          name: data.name,
          type: data.type || "private",
          isActive: true,
        })
        .returning();

      return room as ChatRoom;
    } catch (error) {
      console.error("创建聊天室失败:", error);
      return null;
    }
  },

  /**
   * 根据课程ID获取聊天室
   */
  async getChatRoomByCourseId(courseId: string): Promise<ChatRoom | null> {
    const db = await getDb();

    try {
      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.courseId, courseId))
        .limit(1);

      return room as ChatRoom || null;
    } catch (error) {
      console.error("获取聊天室失败:", error);
      return null;
    }
  },

  /**
   * 根据预约ID获取聊天室
   */
  async getChatRoomByBookingId(bookingId: string): Promise<ChatRoom | null> {
    const db = await getDb();

    try {
      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.bookingId, bookingId))
        .limit(1);

      return room as ChatRoom || null;
    } catch (error) {
      console.error("获取聊天室失败:", error);
      return null;
    }
  },

  /**
   * 获取聊天室详情（包含最后一条消息）
   */
  async getChatRoomDetail(roomId: string, userId?: string): Promise<ChatRoom | null> {
    const db = await getDb();

    try {
      // 获取聊天室信息
      const [room] = await db
        .select()
        .from(chatRooms)
        .where(eq(chatRooms.id, roomId))
        .limit(1);

      if (!room) return null;

      // 获取最后一条消息
      const [lastMessage] = await db
        .select({
          id: chatMessages.id,
          userId: chatMessages.userId,
          messageType: chatMessages.messageType,
          content: chatMessages.content,
          isRead: chatMessages.isRead,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(eq(chatMessages.roomId, roomId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      // 获取未读消息数
      let unreadCount = 0;
      if (userId) {
        const [unreadResult] = await db
          .select({
            count: sql<number>`COUNT(*)`,
          })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.roomId, roomId),
              sql`${chatMessages.userId} != ${userId}`,
              eq(chatMessages.isRead, false)
            )
          );

        unreadCount = Number(unreadResult?.count) || 0;
      }

      return {
        ...room,
        lastMessage: lastMessage as ChatMessage | undefined,
        unreadCount,
      };
    } catch (error) {
      console.error("获取聊天室详情失败:", error);
      return null;
    }
  },

  /**
   * 发送消息
   */
  async sendMessage(
    data: InsertChatMessage & { roomId: string; userId: string; content: string; messageType?: string }
  ): Promise<ChatMessage | null> {
    const db = await getDb();

    try {
      const [message] = await db
        .insert(chatMessages)
        .values({
          roomId: data.roomId,
          userId: data.userId,
          messageType: data.messageType || "text",
          content: data.content,
          isRead: false,
        })
        .returning();

      // 更新聊天室的updated_at
      await db
        .update(chatRooms)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(chatRooms.id, data.roomId));

      return message as ChatMessage;
    } catch (error) {
      console.error("发送消息失败:", error);
      return null;
    }
  },

  /**
   * 获取聊天室消息列表
   */
  async getMessages(
    roomId: string,
    options: {
      limit?: number;
      beforeId?: string;
      afterId?: string;
    } = {}
  ): Promise<ChatMessage[]> {
    const db = await getDb();
    const { limit = 50, beforeId, afterId } = options;

    try {
      const conditions = [eq(chatMessages.roomId, roomId)];

      if (beforeId) {
        // 获取beforeId之前的消息
        const [beforeMessage] = await db
          .select({ createdAt: chatMessages.createdAt })
          .from(chatMessages)
          .where(eq(chatMessages.id, beforeId))
          .limit(1);

        if (beforeMessage) {
          conditions.push(sql`${chatMessages.createdAt} < ${beforeMessage.createdAt}`);
        }
      } else if (afterId) {
        // 获取afterId之后的消息
        const [afterMessage] = await db
          .select({ createdAt: chatMessages.createdAt })
          .from(chatMessages)
          .where(eq(chatMessages.id, afterId))
          .limit(1);

        if (afterMessage) {
          conditions.push(sql`${chatMessages.createdAt} > ${afterMessage.createdAt}`);
        }
      }

      const query = db
        .select({
          id: chatMessages.id,
          roomId: chatMessages.roomId,
          userId: chatMessages.userId,
          messageType: chatMessages.messageType,
          content: chatMessages.content,
          isRead: chatMessages.isRead,
          createdAt: chatMessages.createdAt,
          userName: users.name,
          userAvatar: users.avatar,
        })
        .from(chatMessages)
        .innerJoin(users, eq(chatMessages.userId, users.id))
        .where(and(...conditions));

      const messages = await query
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

      // 转换为正确的格式
      return messages.map((msg) => ({
        id: msg.id,
        roomId: msg.roomId,
        userId: msg.userId,
        user: {
          id: msg.userId,
          name: msg.userName,
          avatar: msg.userAvatar,
        },
        messageType: msg.messageType,
        content: msg.content,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      console.error("获取消息列表失败:", error);
      return [];
    }
  },

  /**
   * 标记消息为已读
   */
  async markAsRead(roomId: string, userId: string): Promise<boolean> {
    const db = await getDb();

    try {
      await db
        .update(chatMessages)
        .set({
          isRead: true,
        })
        .where(
          and(
            eq(chatMessages.roomId, roomId),
            sql`${chatMessages.userId} != ${userId}`,
            eq(chatMessages.isRead, false)
          )
        );

      return true;
    } catch (error) {
      console.error("标记消息已读失败:", error);
      return false;
    }
  },

  /**
   * 删除30天前的消息
   */
  async deleteOldMessages(days: number = 30): Promise<number> {
    const db = await getDb();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await db
        .delete(chatMessages)
        .where(sql`${chatMessages.createdAt} < ${cutoffDate}`)
        .returning();

      console.log(`删除了 ${result.length} 条 ${days} 天前的聊天记录`);
      return result.length;
    } catch (error) {
      console.error("删除旧消息失败:", error);
      return 0;
    }
  },

  /**
   * 管理员获取所有聊天室
   */
  async getAllChatRooms(options: {
    limit?: number;
    offset?: number;
    keyword?: string;
  } = {}): Promise<{ rooms: ChatRoom[]; total: number }> {
    const db = await getDb();
    const { limit = 20, offset = 0, keyword } = options;

    try {
      // 构建查询条件
      const conditions = [];
      if (keyword) {
        conditions.push(
          sql`${chatRooms.name} ILIKE ${`%${keyword}%`}`
        );
      }

      // 获取总数
      const [countResult] = await db
        .select({
          total: sql<number>`COUNT(*)`,
        })
        .from(chatRooms)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = Number(countResult?.total) || 0;

      // 获取列表
      const rooms = await db
        .select()
        .from(chatRooms)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(chatRooms.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        rooms: rooms as ChatRoom[],
        total,
      };
    } catch (error) {
      console.error("获取聊天室列表失败:", error);
      return {
        rooms: [],
        total: 0,
      };
    }
  },

  /**
   * 管理员获取聊天室的所有消息
   */
  async getAllRoomMessages(
    roomId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const db = await getDb();
    const { limit = 50, offset = 0 } = options;

    try {
      // 获取总数
      const [countResult] = await db
        .select({
          total: sql<number>`COUNT(*)`,
        })
        .from(chatMessages)
        .where(eq(chatMessages.roomId, roomId));

      const total = Number(countResult?.total) || 0;

      // 获取消息列表
      const messages = await db
        .select({
          id: chatMessages.id,
          roomId: chatMessages.roomId,
          userId: chatMessages.userId,
          messageType: chatMessages.messageType,
          content: chatMessages.content,
          isRead: chatMessages.isRead,
          createdAt: chatMessages.createdAt,
          userName: users.name,
          userAvatar: users.avatar,
        })
        .from(chatMessages)
        .innerJoin(users, eq(chatMessages.userId, users.id))
        .where(eq(chatMessages.roomId, roomId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit)
        .offset(offset);

      // 转换格式
      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        roomId: msg.roomId,
        userId: msg.userId,
        user: {
          id: msg.userId,
          name: msg.userName,
          avatar: msg.userAvatar,
        },
        messageType: msg.messageType,
        content: msg.content,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      }));

      return {
        messages: formattedMessages,
        total,
      };
    } catch (error) {
      console.error("获取聊天室消息失败:", error);
      return {
        messages: [],
        total: 0,
      };
    }
  },
};
