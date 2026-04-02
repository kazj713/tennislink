import { NextRequest, NextResponse } from "next/server";
import { notifications } from "@/storage/database/shared/schema";
import { db } from "@/storage/database/instance";
import { verifyToken } from "@/lib/auth";
import { insertNotificationSchema, updateNotificationSchema } from "@/storage/database/shared/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No session found" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as "unread" | "read" | "archived";
    const type = searchParams.get("type");
    const limit = Number(searchParams.get("limit") || 50);
    const offset = Number(searchParams.get("offset") || 0);

    const conditions = [eq(notifications.userId, user.userId)];
    if (status) conditions.push(eq(notifications.status, status as "unread" | "read" | "archived"));
    if (type) conditions.push(eq(notifications.type, type as "payment" | "booking" | "system" | "coach_review" | "matchup" | "tournament" | "vip"));

    const notificationList = await db.select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    const totalCount = await db.select({ count: count() })
      .from(notifications)
      .where(eq(notifications.userId, user.userId))
      .execute();

    const unreadCountResult = await db.select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.userId), eq(notifications.status, "unread")))
      .execute();

    return NextResponse.json({
      notifications: notificationList,
      totalCount: totalCount[0]?.count || 0,
      unreadCount: unreadCountResult[0]?.count || 0
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No session found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedBody = insertNotificationSchema.parse(body);

    if (validatedBody.userId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot create notification for another user" },
        { status: 403 }
      );
    }

    const newNotification = await db.insert(notifications).values(validatedBody).returning().execute();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyToken();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No session found" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Bad Request: Notification ID is required" },
        { status: 400 }
      );
    }

    const validatedData = updateNotificationSchema.parse(updateData);

    const existingNotification = await db.select().from(notifications).where(eq(notifications.id, id)).execute();

    if (!existingNotification[0]) {
      return NextResponse.json(
        { error: "Not Found: Notification not found" },
        { status: 404 }
      );
    }

    if (existingNotification[0].userId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot update notification for another user" },
        { status: 403 }
      );
    }

    const updatedNotification = await db.update(notifications).set(validatedData).where(eq(notifications.id, id)).returning().execute();

    return NextResponse.json(updatedNotification[0]);
  } catch (error) {
    console.error("Error updating notification:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No session found" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const markAllAsRead = searchParams.get("markAllAsRead") === "true";

    if (markAllAsRead) {
      await db.update(notifications).set({ status: "read" }).where(and(eq(notifications.userId, user.userId), eq(notifications.status, "unread"))).execute();
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Bad Request: Notification ID is required" },
        { status: 400 }
      );
    }

    const existingNotification = await db.select().from(notifications).where(eq(notifications.id, id)).execute();

    if (!existingNotification[0]) {
      return NextResponse.json(
        { error: "Not Found: Notification not found" },
        { status: 404 }
      );
    }

    if (existingNotification[0].userId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete notification for another user" },
        { status: 403 }
      );
    }

    await db.delete(notifications).where(eq(notifications.id, id)).execute();

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

