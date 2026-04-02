import { Notification } from "@/storage/database/shared/schema";

interface GetNotificationsParams {
  status?: "unread" | "read" | "archived";
  type?: string | null;
  limit?: number;
  offset?: number;
}

interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}

/**
 * 获取用户通知列表
 */
export async function getNotifications(params: GetNotificationsParams = {}): Promise<NotificationsResponse> {
  const {
    status,
    type,
    limit = 50,
    offset = 0
  } = params;

  const searchParams = new URLSearchParams();
  
  if (status) {
    searchParams.append("status", status);
  }
  
  if (type) {
    searchParams.append("type", type);
  }
  
  searchParams.append("limit", limit.toString());
  searchParams.append("offset", offset.toString());

  const response = await fetch(`/api/notifications?${searchParams.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch notifications: ${response.status}`);
  }

  return response.json();
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: notificationId,
      status: "read"
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to mark notification as read: ${response.status}`);
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch(`/api/notifications?markAllAsRead=true`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to mark all notifications as read: ${response.status}`);
  }
}

/**
 * 删除通知
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications?id=${notificationId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete notification: ${response.status}`);
  }
}

/**
 * 创建新通知
 */
export async function createNotification(data: {
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
}): Promise<Notification> {
  const response = await fetch(`/api/notifications`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create notification: ${response.status}`);
  }

  return response.json();
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const data = await getNotifications({ status: "unread", limit: 1 });
    return data.unreadCount;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}