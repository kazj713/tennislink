/**
 * 支付管理器
 * 处理支付状态的更新和相关业务逻辑
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./instance";
import {
  paymentOrders,
  users,
  insertPaymentOrderSchema,
  updatePaymentOrderSchema,
  type PaymentOrder,
  type InsertPaymentOrder,
  type UpdatePaymentOrder,
} from "./shared/schema";
import { bookings } from "./shared/schema";
import { userVipSubscriptions } from "./shared/schema";
import { courses } from "./shared/schema";
import { notifications } from "./shared/schema";
import { sendPaymentSuccessEmail, isEmailServiceAvailable } from "@/lib/email";

export interface PaymentInfo {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paidAmount?: number;
  paymentMethod: 'wechat' | 'alipay';
  buyerId?: string;
  buyerAccount?: string;
}

export interface OrderInfo {
  id: string;
  userId: string;
  type: 'booking' | 'membership' | 'course' | 'product';
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  items: any[];
}

/**
 * 创建支付订单
 */
export async function createPaymentOrder(orderData: InsertPaymentOrder): Promise<PaymentOrder | null> {
  try {
    const db = await getDb();
    const validated = insertPaymentOrderSchema.parse(orderData);
    
    const [result] = await db
      .insert(paymentOrders)
      .values({
        ...validated,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    console.log('创建支付订单成功:', result.orderNo);
    return result || null;
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return null;
  }
}

/**
 * 获取订单信息
 */
export async function getOrderById(orderId: string): Promise<PaymentOrder | null> {
  try {
    const db = await getDb();
    
    const [result] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, orderId));
    
    return result || null;
  } catch (error) {
    console.error('获取订单信息失败:', error);
    return null;
  }
}

/**
 * 根据订单号获取订单
 */
export async function getOrderByOrderNo(orderNo: string): Promise<PaymentOrder | null> {
  try {
    const db = await getDb();
    
    const [result] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.orderNo, orderNo));
    
    return result || null;
  } catch (error) {
    console.error('根据订单号获取订单失败:', error);
    return null;
  }
}

/**
 * 更新订单状态
 */
export async function updateOrderStatus(orderId: string, updateData: UpdatePaymentOrder): Promise<boolean> {
  try {
    const db = await getDb();
    const validated = updatePaymentOrderSchema.parse(updateData);
    
    const [result] = await db
      .update(paymentOrders)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, orderId))
      .returning();
    
    console.log('订单状态更新成功:', orderId, updateData.status);
    return !!result;
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return false;
  }
}

/**
 * 更新支付状态
 */
export async function updatePaymentStatus(orderId: string, paymentInfo: PaymentInfo): Promise<boolean> {
  try {
    // 1. 验证订单存在
    const order = await getOrderById(orderId);
    if (!order) {
      console.error('订单不存在:', orderId);
      return false;
    }

    // 2. 检查订单状态
    if (order.status === 'paid') {
      console.log('订单已支付:', orderId);
      return true;
    }

    // 3. 更新订单状态
    const updatedOrder = await updateOrderStatus(orderId, {
      status: paymentInfo.status === 'SUCCESS' ? 'paid' : 'failed',
      paidAmount: paymentInfo.paidAmount?.toString(),
      transactionId: paymentInfo.transactionId,
      paymentMethod: paymentInfo.paymentMethod,
      buyerId: paymentInfo.buyerId,
      buyerAccount: paymentInfo.buyerAccount,
      paidAt: paymentInfo.status === 'SUCCESS' ? new Date() : null,
    });

    if (!updatedOrder) {
      console.error('更新订单状态失败:', orderId);
      return false;
    }

    // 4. 触发相关业务逻辑
    if (paymentInfo.status === 'SUCCESS') {
      await triggerPaymentSuccessActions(order, paymentInfo);
    }

    return true;
  } catch (error) {
    console.error('更新支付状态异常:', error);
    return false;
  }
}

/**
 * 触发支付成功后的业务逻辑
 */
async function triggerPaymentSuccessActions(order: PaymentOrder, paymentInfo: PaymentInfo): Promise<void> {
  try {
    switch (order.type) {
      case 'booking':
        await handleBookingPayment(order, paymentInfo);
        break;
      case 'membership':
        await handleMembershipPayment(order, paymentInfo);
        break;
      case 'course':
        await handleCoursePayment(order, paymentInfo);
        break;
      case 'product':
        await handleProductPayment(order, paymentInfo);
        break;
      default:
        console.warn('未知的订单类型:', order.type);
    }

    // 发送支付成功通知
    await sendPaymentNotification(order, paymentInfo);
  } catch (error) {
    console.error('触发支付成功动作失败:', error);
  }
}

/**
 * 处理预约支付
 */
async function handleBookingPayment(order: PaymentOrder, paymentInfo: PaymentInfo): Promise<void> {
  try {
    const db = await getDb();
    
    // 从 metadata 中获取预约 ID
    const metadata = order.metadata as any;
    const bookingId = metadata?.bookingId;
    
    if (bookingId) {
      // 1. 更新预约状态为已确认
      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentAmount: order.paidAmount,
          transactionId: paymentInfo.transactionId,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));
      
      console.log(`预约 ${bookingId} 状态已更新为已确认`);
      
      // 2. 发送预约确认通知给用户
      await createNotification({
        userId: order.userId,
        type: 'booking',
        title: '预约成功',
        message: '您的课程预约已确认，请按时参加课程。',
        relatedId: bookingId,
        relatedType: 'booking',
      });
      
      // 3. 发送预约通知给教练
      const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
      if (booking.length > 0) {
        await createNotification({
          userId: booking[0].coachId,
          type: 'booking',
          title: '新的课程预约',
          message: '您有一节课程已被预约并支付成功。',
          relatedId: bookingId,
          relatedType: 'booking',
        });
      }
      
      // 4. 创建日历事件（这里只是记录日志，实际应该集成日历服务）
      console.log(`为预约 ${bookingId} 创建日历事件`);
    }
  } catch (error) {
    console.error('处理预约支付失败:', error);
  }
}

/**
 * 处理会员支付
 */
async function handleMembershipPayment(order: PaymentOrder, paymentInfo: PaymentInfo): Promise<void> {
  try {
    const db = await getDb();
    
    // 从 metadata 中获取会员订阅 ID
    const metadata = order.metadata as any;
    const subscriptionId = metadata?.subscriptionId;
    
    if (subscriptionId) {
      // 1. 激活会员资格
      await db
        .update(userVipSubscriptions)
        .set({
          status: 'active',
          paymentStatus: 'paid',
          transactionId: paymentInfo.transactionId,
        })
        .where(eq(userVipSubscriptions.id, subscriptionId));
      
      console.log(`会员订阅 ${subscriptionId} 已激活`);
      
      // 2. 发送会员激活通知
      await createNotification({
        userId: order.userId,
        type: 'vip',
        title: '会员已激活',
        message: '您的会员资格已激活，享受专属权益！',
        relatedId: subscriptionId,
        relatedType: 'vip_subscription',
      });
    }
  } catch (error) {
    console.error('处理会员支付失败:', error);
  }
}

/**
 * 处理课程支付
 */
async function handleCoursePayment(order: PaymentOrder, paymentInfo: PaymentInfo): Promise<void> {
  try {
    const db = await getDb();
    
    // 从 metadata 中获取课程 ID 和预约 ID
    const metadata = order.metadata as any;
    const courseId = metadata?.courseId;
    const bookingId = metadata?.bookingId;
    
    if (bookingId) {
      // 1. 更新预约状态
      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentAmount: order.paidAmount,
          transactionId: paymentInfo.transactionId,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));
      
      console.log(`课程预约 ${bookingId} 已确认`);
      
      // 2. 发送课程加入确认
      await createNotification({
        userId: order.userId,
        type: 'booking',
        title: '课程报名成功',
        message: '您已成功报名课程，请按时上课。',
        relatedId: bookingId,
        relatedType: 'booking',
      });
      
      // 3. 更新课程报名人数（如果有相关字段）
      if (courseId) {
        console.log(`更新课程 ${courseId} 报名人数`);
      }
    }
  } catch (error) {
    console.error('处理课程支付失败:', error);
  }
}

/**
 * 处理商品支付
 */
async function handleProductPayment(order: PaymentOrder, paymentInfo: PaymentInfo): Promise<void> {
  try {
    // 1. 创建发货单（这里只是记录日志，实际应该创建发货单）
    console.log(`为订单 ${order.id} 创建发货单`);
    
    // 2. 减少库存（这里只是记录日志，实际应该更新库存）
    console.log('更新商品库存');
    
    // 3. 发送订单确认和发货通知
    await createNotification({
      userId: order.userId,
      type: 'payment',
      title: '订单支付成功',
      message: '您的订单已支付成功，我们将尽快为您发货。',
      relatedId: order.id,
      relatedType: 'order',
    });
  } catch (error) {
    console.error('处理商品支付失败:', error);
  }
}

/**
 * 发送支付通知
 */
async function sendPaymentNotification(order: PaymentOrder, paymentInfo: PaymentInfo): Promise<void> {
  try {
    // 1. 发送站内通知
    await createNotification({
      userId: order.userId,
      type: 'payment',
      title: '支付成功',
      message: `您的订单已支付成功，支付金额：${order.paidAmount}元`,
      relatedId: order.id,
      relatedType: 'order',
    });
    
    // 2. 获取用户邮箱
    const db = await getDb();
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, order.userId));
    
    // 3. 发送邮件通知
    if (user?.email && isEmailServiceAvailable()) {
      const emailResult = await sendPaymentSuccessEmail(user.email, {
        orderNo: order.orderNo,
        amount: order.paidAmount?.toString() || order.amount.toString(),
        type: order.type,
        createdAt: order.paidAt || new Date(),
      });
      
      if (emailResult.success) {
        console.log(`[支付通知] 邮件发送成功: ${user.email}`);
      } else {
        console.error(`[支付通知] 邮件发送失败: ${emailResult.error}`);
      }
    } else {
      if (!user?.email) {
        console.warn('[支付通知] 用户未设置邮箱，跳过邮件通知');
      } else {
        console.warn('[支付通知] 邮件服务未配置，跳过邮件通知');
      }
    }
    
    // 4. TODO: 发送微信/短信通知给用户（需要集成微信/短信服务）
    console.log('[支付通知] 微信/短信通知待实现');
    
    // 5. 记录通知日志
    console.log(`[支付通知] 支付通知已发送，订单号：${order.orderNo}`);
  } catch (error) {
    console.error('[支付通知] 发送支付通知失败:', error);
  }
}

/**
 * 创建通知
 */
async function createNotification(notificationData: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    
    await db
      .insert(notifications)
      .values({
        ...notificationData,
        type: notificationData.type as any,
        status: 'unread',
        createdAt: new Date(),
      } as any);
    
    console.log(`通知已创建：${notificationData.title}`);
  } catch (error) {
    console.error('创建通知失败:', error);
  }
}

/**
 * 获取用户的订单列表
 */
export async function getUserOrders(userId: string, limit: number = 20): Promise<PaymentOrder[]> {
  try {
    const db = await getDb();
    
    const results = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.userId, userId))
      .limit(limit);
    
    return results;
  } catch (error) {
    console.error('获取用户订单列表失败:', error);
    return [];
  }
}

/**
 * 退款处理
 */
export async function refundOrder(orderId: string, refundAmount: number, reason: string): Promise<boolean> {
  try {
    const db = await getDb();
    
    const [result] = await db
      .update(paymentOrders)
      .set({
        status: 'refunded',
        refundAmount: refundAmount.toString(),
        refundReason: reason,
        refundedAt: new Date(),
      })
      .where(eq(paymentOrders.id, orderId))
      .returning();
    
    console.log(`订单 ${orderId} 已退款，金额：${refundAmount}`);
    return !!result;
  } catch (error) {
    console.error('退款处理失败:', error);
    return false;
  }
}
