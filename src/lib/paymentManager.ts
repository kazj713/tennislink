/**
 * 支付管理器（兼容层）
 * 处理支付状态的更新和相关业务逻辑
 * 已迁移到：src/storage/database/paymentManager.ts
 */

export {
  createPaymentOrder,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  refundOrder,
  getUserOrders,
  type PaymentInfo,
  type OrderInfo,
} from '@/storage/database/paymentManager';

export type { PaymentOrder } from '@/storage/database/shared/schema';
