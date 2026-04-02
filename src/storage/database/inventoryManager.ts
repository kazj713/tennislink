/**
 * 商品库存管理器
 * 管理商品、库存、订单和发货
 */

import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getDb } from "./instance";
import {
  products,
  inventory,
  orders,
  orderItems,
  inventoryTransactions,
  type Product,
  type Inventory,
  type Order,
  type OrderItem,
  type InventoryTransaction,
} from "./shared/schema";
import { logger } from "@/lib/logger";

/**
 * 创建商品
 */
export async function createProduct(data: {
  name: string;
  description?: string;
  category: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  specifications?: Record<string, string>;
  status?: string;
}): Promise<Product> {
  const db = await getDb();

  const [product] = await db
    .insert(products)
    .values({
      ...data,
      status: data.status || "active",
    })
    .returning();

  logger.info("创建商品", { productId: product.id, name: product.name });

  // 初始化库存记录
  await db.insert(inventory).values({
    productId: product.id,
    quantity: 0,
    reservedQuantity: 0,
    lowStockThreshold: 10,
  });

  return product;
}

/**
 * 获取商品列表
 */
export async function getProducts(params?: {
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ products: Product[]; total: number }> {
  const db = await getDb();

  let query = db.select().from(products);

  if (params?.category) {
    query = query.where(eq(products.category, params.category));
  }

  if (params?.status) {
    query = query.where(eq(products.status, params.status));
  }

  if (params?.minPrice !== undefined) {
    query = query.where(gte(products.price, params.minPrice));
  }

  if (params?.maxPrice !== undefined) {
    query = query.where(lte(products.price, params.maxPrice));
  }

  if (params?.search) {
    query = query.where(
      sql`${products.name} ILIKE ${`%${params.search}%`} OR ${products.description} ILIKE ${`%${params.search}%`}`
    );
  }

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);
  const total = countResult[0]?.count || 0;

  // 分页
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.offset(params.offset);
  }

  const productList = await query.orderBy(desc(products.createdAt));

  return { products: productList, total };
}

/**
 * 获取商品详情
 */
export async function getProductById(productId: string): Promise<{
  product: Product;
  inventory: Inventory | null;
}> {
  const db = await getDb();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));

  if (!product) {
    throw new Error("商品不存在");
  }

  const [inventoryData] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId));

  return { product, inventory: inventoryData || null };
}

/**
 * 更新商品
 */
export async function updateProduct(
  productId: string,
  data: Partial<Product>
): Promise<Product> {
  const db = await getDb();

  const [product] = await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId))
    .returning();

  logger.info("更新商品", { productId, name: product.name });

  return product;
}

/**
 * 删除商品
 */
export async function deleteProduct(productId: string): Promise<void> {
  const db = await getDb();

  // 检查是否有未完成的订单
  const pendingOrders = await db
    .select({ count: sql<number>`count(*)` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        eq(orders.status, "pending")
      )
    );

  if (pendingOrders[0]?.count > 0) {
    throw new Error("该商品有未完成的订单，无法删除");
  }

  // 软删除
  await db
    .update(products)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(eq(products.id, productId));

  logger.info("删除商品", { productId });
}

/**
 * 更新库存
 */
export async function updateInventory(
  productId: string,
  quantity: number,
  type: "in" | "out" | "adjust",
  reason: string,
  operatorId?: string
): Promise<Inventory> {
  const db = await getDb();

  // 获取当前库存
  const [currentInventory] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId));

  if (!currentInventory) {
    throw new Error("库存记录不存在");
  }

  let newQuantity = currentInventory.quantity;

  if (type === "in") {
    newQuantity += quantity;
  } else if (type === "out") {
    if (currentInventory.quantity < quantity) {
      throw new Error("库存不足");
    }
    newQuantity -= quantity;
  } else if (type === "adjust") {
    newQuantity = quantity;
  }

  // 更新库存
  const [updatedInventory] = await db
    .update(inventory)
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where(eq(inventory.productId, productId))
    .returning();

  // 记录库存变动
  await db.insert(inventoryTransactions).values({
    productId,
    type,
    quantity,
    beforeQuantity: currentInventory.quantity,
    afterQuantity: newQuantity,
    reason,
    operatorId,
  });

  logger.info("更新库存", {
    productId,
    type,
    quantity,
    before: currentInventory.quantity,
    after: newQuantity,
  });

  return updatedInventory;
}

/**
 * 预留库存（创建订单时）
 */
export async function reserveInventory(
  productId: string,
  quantity: number
): Promise<boolean> {
  const db = await getDb();

  const [currentInventory] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId));

  if (!currentInventory) {
    throw new Error("库存记录不存在");
  }

  const availableQuantity =
    currentInventory.quantity - currentInventory.reservedQuantity;

  if (availableQuantity < quantity) {
    return false;
  }

  await db
    .update(inventory)
    .set({
      reservedQuantity: currentInventory.reservedQuantity + quantity,
      updatedAt: new Date(),
    })
    .where(eq(inventory.productId, productId));

  logger.info("预留库存", { productId, quantity });

  return true;
}

/**
 * 释放预留库存（取消订单时）
 */
export async function releaseReservedInventory(
  productId: string,
  quantity: number
): Promise<void> {
  const db = await getDb();

  const [currentInventory] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId));

  if (!currentInventory) {
    throw new Error("库存记录不存在");
  }

  const newReservedQuantity = Math.max(
    0,
    currentInventory.reservedQuantity - quantity
  );

  await db
    .update(inventory)
    .set({
      reservedQuantity: newReservedQuantity,
      updatedAt: new Date(),
    })
    .where(eq(inventory.productId, productId));

  logger.info("释放预留库存", { productId, quantity });
}

/**
 * 确认扣减库存（支付完成时）
 */
export async function confirmInventoryDeduction(
  productId: string,
  quantity: number
): Promise<void> {
  const db = await getDb();

  const [currentInventory] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId));

  if (!currentInventory) {
    throw new Error("库存记录不存在");
  }

  await db
    .update(inventory)
    .set({
      quantity: currentInventory.quantity - quantity,
      reservedQuantity: Math.max(0, currentInventory.reservedQuantity - quantity),
      updatedAt: new Date(),
    })
    .where(eq(inventory.productId, productId));

  logger.info("确认扣减库存", { productId, quantity });
}

/**
 * 创建订单
 */
export async function createOrder(data: {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  address: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
    zipCode?: string;
  };
  remark?: string;
}): Promise<Order> {
  const db = await getDb();

  // 计算订单金额
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 创建订单
  const [order] = await db
    .insert(orders)
    .values({
      userId: data.userId,
      totalAmount,
      status: "pending",
      address: data.address,
      remark: data.remark,
    })
    .returning();

  // 创建订单项并预留库存
  for (const item of data.items) {
    // 预留库存
    const reserved = await reserveInventory(item.productId, item.quantity);
    if (!reserved) {
      // 回滚已预留的库存
      for (const reservedItem of data.items) {
        if (reservedItem.productId === item.productId) break;
        await releaseReservedInventory(reservedItem.productId, reservedItem.quantity);
      }
      throw new Error(`商品库存不足: ${item.productId}`);
    }

    // 创建订单项
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.price * item.quantity,
    });
  }

  logger.info("创建订单", { orderId: order.id, userId: data.userId, totalAmount });

  return order;
}

/**
 * 获取订单列表
 */
export async function getOrders(params?: {
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ orders: Order[]; total: number }> {
  const db = await getDb();

  let query = db.select().from(orders);

  if (params?.userId) {
    query = query.where(eq(orders.userId, params.userId));
  }

  if (params?.status) {
    query = query.where(eq(orders.status, params.status));
  }

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders);
  const total = countResult[0]?.count || 0;

  // 分页
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.offset(params.offset);
  }

  const orderList = await query.orderBy(desc(orders.createdAt));

  return { orders: orderList, total };
}

/**
 * 获取订单详情
 */
export async function getOrderById(orderId: string): Promise<{
  order: Order;
  items: Array<OrderItem & { product: Product }>;
}> {
  const db = await getDb();

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order) {
    throw new Error("订单不存在");
  }

  const items = await db
    .select({
      item: orderItems,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  return {
    order,
    items: items.map((i) => ({ ...i.item, product: i.product })),
  };
}

/**
 * 更新订单状态
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  trackingNumber?: string
): Promise<Order> {
  const db = await getDb();

  const updateData: Partial<Order> = {
    status,
    updatedAt: new Date(),
  };

  if (trackingNumber) {
    updateData.trackingNumber = trackingNumber;
  }

  if (status === "paid") {
    updateData.paidAt = new Date();

    // 确认扣减库存
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      await confirmInventoryDeduction(item.productId, item.quantity);
    }
  }

  if (status === "shipped") {
    updateData.shippedAt = new Date();
  }

  if (status === "delivered") {
    updateData.deliveredAt = new Date();
  }

  if (status === "cancelled") {
    // 释放预留库存
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      await releaseReservedInventory(item.productId, item.quantity);
    }
  }

  const [order] = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId))
    .returning();

  logger.info("更新订单状态", { orderId, status });

  return order;
}

/**
 * 获取低库存商品
 */
export async function getLowStockProducts(): Promise<
  Array<Product & { inventory: Inventory }>
> {
  const db = await getDb();

  const result = await db
    .select({
      product: products,
      inventory: inventory,
    })
    .from(products)
    .innerJoin(inventory, eq(products.id, inventory.productId))
    .where(
      and(
        eq(products.status, "active"),
        sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`
      )
    );

  return result.map((r) => ({ ...r.product, inventory: r.inventory }));
}

/**
 * 获取库存变动记录
 */
export async function getInventoryTransactions(params?: {
  productId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ transactions: InventoryTransaction[]; total: number }> {
  const db = await getDb();

  let query = db.select().from(inventoryTransactions);

  if (params?.productId) {
    query = query.where(eq(inventoryTransactions.productId, params.productId));
  }

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(inventoryTransactions);
  const total = countResult[0]?.count || 0;

  // 分页
  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.offset(params.offset);
  }

  const transactions = await query.orderBy(desc(inventoryTransactions.createdAt));

  return { transactions, total };
}
