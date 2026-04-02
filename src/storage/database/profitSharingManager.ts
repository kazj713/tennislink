import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./instance";
import {
  profitSharingRules,
  profitSharingRecipients,
  profitSharingRecords,
  settlementRecords,
  settlementProfitSharingLinks,
  insertProfitSharingRuleSchema,
  updateProfitSharingRuleSchema,
  insertProfitSharingRecipientSchema,
  updateProfitSharingRecipientSchema,
  insertProfitSharingRecordSchema,
  updateProfitSharingRecordSchema,
  insertSettlementRecordSchema,
  updateSettlementRecordSchema,
  insertSettlementProfitSharingLinkSchema,
} from "./shared/schema";
import { logger } from "@/lib/logger";
import type {
  ProfitSharingRule,
  InsertProfitSharingRule,
  UpdateProfitSharingRule,
  ProfitSharingRecipient,
  InsertProfitSharingRecipient,
  UpdateProfitSharingRecipient,
  ProfitSharingRecord,
  InsertProfitSharingRecord,
  UpdateProfitSharingRecord,
  SettlementRecord,
  InsertSettlementRecord,
  UpdateSettlementRecord,
  SettlementProfitSharingLink,
  InsertSettlementProfitSharingLink,
} from "./shared/schema";

/**
 * 分账管理器
 * 负责分账相关的数据库操作，包括分账规则管理、接收方管理、分账记录处理和结算管理
 */
export class ProfitSharingManager {
  private logger = logger.withContext('ProfitSharingManager');
  /**
   * 创建分账规则
   * @param data 分账规则数据
   * @returns 创建的分账规则对象
   */
  async createProfitSharingRule(data: InsertProfitSharingRule): Promise<ProfitSharingRule> {
    const validated = insertProfitSharingRuleSchema.parse(data);
    const [rule] = await db.insert(profitSharingRules).values(validated).returning();
    return rule;
  }

  /**
   * 获取分账规则列表
   * @param options 查询选项
   * @returns 分账规则列表
   */
  async getProfitSharingRules(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<ProfitSharingRule, "type" | "isActive">>;
  } = {}): Promise<ProfitSharingRule[]> {
    const { skip = 0, limit = 100, filters = {} } = options;

    const conditions = [];
    if (filters.type !== undefined) {
      conditions.push(eq(profitSharingRules.type, filters.type));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(profitSharingRules.isActive, filters.isActive));
    }

    const query = db
      .select()
      .from(profitSharingRules)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(profitSharingRules.createdAt));

    return query.execute();
  }

  /**
   * 根据ID获取分账规则
   * @param id 分账规则ID
   * @returns 分账规则对象，不存在则返回null
   */
  async getProfitSharingRuleById(id: string): Promise<ProfitSharingRule | null> {
    const [rule] = await db.select().from(profitSharingRules).where(eq(profitSharingRules.id, id)).execute();
    return rule || null;
  }

  /**
   * 更新分账规则
   * @param id 分账规则ID
   * @param data 要更新的数据
   * @returns 更新后的分账规则对象，失败则返回null
   */
  async updateProfitSharingRule(id: string, data: UpdateProfitSharingRule): Promise<ProfitSharingRule | null> {
    const validated = updateProfitSharingRuleSchema.parse(data);
    const [rule] = await db
      .update(profitSharingRules)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(profitSharingRules.id, id))
      .returning()
      .execute();
    return rule || null;
  }

  /**
   * 删除分账规则
   * @param id 分账规则ID
   * @returns 是否删除成功
   */
  async deleteProfitSharingRule(id: string): Promise<boolean> {
    const result = await db.delete(profitSharingRules).where(eq(profitSharingRules.id, id)).execute();
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 创建分账接收方
   * @param data 分账接收方数据
   * @returns 创建的分账接收方对象
   */
  async createProfitSharingRecipient(data: InsertProfitSharingRecipient): Promise<ProfitSharingRecipient> {
    const validated = insertProfitSharingRecipientSchema.parse(data);
    const [recipient] = await db.insert(profitSharingRecipients).values(validated).returning().execute();
    return recipient;
  }

  /**
   * 获取分账接收方列表
   * @param options 查询选项
   * @returns 分账接收方列表
   */
  async getProfitSharingRecipients(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<ProfitSharingRecipient, "userId" | "coachId" | "type" | "isActive">>;
  } = {}): Promise<ProfitSharingRecipient[]> {
    const { skip = 0, limit = 100, filters = {} } = options;

    const conditions = [];
    if (filters.userId !== undefined) {
      conditions.push(eq(profitSharingRecipients.userId, filters.userId));
    }
    if (filters.coachId !== undefined && filters.coachId !== null) {
      conditions.push(eq(profitSharingRecipients.coachId, filters.coachId));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(profitSharingRecipients.type, filters.type));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(profitSharingRecipients.isActive, filters.isActive));
    }

    const query = db
      .select()
      .from(profitSharingRecipients)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(profitSharingRecipients.createdAt));

    return query.execute();
  }

  /**
   * 根据ID获取分账接收方
   * @param id 分账接收方ID
   * @returns 分账接收方对象，不存在则返回null
   */
  async getProfitSharingRecipientById(id: string): Promise<ProfitSharingRecipient | null> {
    const [recipient] = await db.select().from(profitSharingRecipients).where(eq(profitSharingRecipients.id, id)).execute();
    return recipient || null;
  }

  /**
   * 根据用户ID获取分账接收方
   * @param userId 用户ID
   * @returns 分账接收方对象，不存在则返回null
   */
  async getProfitSharingRecipientByUserId(userId: string): Promise<ProfitSharingRecipient | null> {
    const [recipient] = await db
      .select()
      .from(profitSharingRecipients)
      .where(eq(profitSharingRecipients.userId, userId))
      .execute();
    return recipient || null;
  }

  /**
   * 更新分账接收方
   * @param id 分账接收方ID
   * @param data 要更新的数据
   * @returns 更新后的分账接收方对象，失败则返回null
   */
  async updateProfitSharingRecipient(id: string, data: UpdateProfitSharingRecipient): Promise<ProfitSharingRecipient | null> {
    const validated = updateProfitSharingRecipientSchema.parse(data);
    const [recipient] = await db
      .update(profitSharingRecipients)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(profitSharingRecipients.id, id))
      .returning()
      .execute();
    return recipient || null;
  }

  /**
   * 删除分账接收方
   * @param id 分账接收方ID
   * @returns 是否删除成功
   */
  async deleteProfitSharingRecipient(id: string): Promise<boolean> {
    const result = await db.delete(profitSharingRecipients).where(eq(profitSharingRecipients.id, id)).execute();
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 创建分账记录
   * @param data 分账记录数据
   * @returns 创建的分账记录对象
   */
  async createProfitSharingRecord(data: InsertProfitSharingRecord): Promise<ProfitSharingRecord> {
    this.logger.info('创建分账记录开始', {
      recipientId: data.recipientId,
      amount: data.amount,
      type: data.type,
      bookingId: data.bookingId,
      venueBookingId: data.venueBookingId,
      tournamentParticipantId: data.tournamentParticipantId
    });
    
    try {
      const validated = insertProfitSharingRecordSchema.parse(data);
      const [record] = await db.insert(profitSharingRecords).values(validated).returning().execute();
      
      this.logger.info('创建分账记录成功', {
        recordId: record.id,
        recipientId: record.recipientId,
        amount: record.amount,
        status: record.status
      });
      
      return record;
    } catch (error: any) {
      this.logger.error('创建分账记录失败', {
        error: error.message,
        recipientId: data.recipientId,
        amount: data.amount
      }, error);
      throw error;
    }
  }

  /**
   * 获取分账记录列表
   * @param options 查询选项
   * @returns 分账记录列表
   */
  async getProfitSharingRecords(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<ProfitSharingRecord, "recipientId" | "status" | "type" | "bookingId" | "venueBookingId" | "tournamentParticipantId">>;
  } = {}): Promise<ProfitSharingRecord[]> {
    const { skip = 0, limit = 100, filters = {} } = options;

    const conditions = [];
    if (filters.recipientId !== undefined) {
      conditions.push(eq(profitSharingRecords.recipientId, filters.recipientId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(profitSharingRecords.status, filters.status));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(profitSharingRecords.type, filters.type));
    }
    if (filters.bookingId !== undefined && filters.bookingId !== null) {
      conditions.push(eq(profitSharingRecords.bookingId, filters.bookingId));
    }

    if (filters.venueBookingId !== undefined && filters.venueBookingId !== null) {
      conditions.push(eq(profitSharingRecords.venueBookingId, filters.venueBookingId));
    }

    if (filters.tournamentParticipantId !== undefined && filters.tournamentParticipantId !== null) {
      conditions.push(eq(profitSharingRecords.tournamentParticipantId, filters.tournamentParticipantId));
    }

    const query = db
      .select()
      .from(profitSharingRecords)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(profitSharingRecords.createdAt));

    return query.execute();
  }

  /**
   * 根据ID获取分账记录
   * @param id 分账记录ID
   * @returns 分账记录对象，不存在则返回null
   */
  async getProfitSharingRecordById(id: string): Promise<ProfitSharingRecord | null> {
    const [record] = await db.select().from(profitSharingRecords).where(eq(profitSharingRecords.id, id)).execute();
    return record || null;
  }

  /**
   * 更新分账记录
   * @param id 分账记录ID
   * @param data 要更新的数据
   * @returns 更新后的分账记录对象，失败则返回null
   */
  async updateProfitSharingRecord(id: string, data: UpdateProfitSharingRecord): Promise<ProfitSharingRecord | null> {
    const validated = updateProfitSharingRecordSchema.parse(data);
    const [record] = await db
      .update(profitSharingRecords)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(profitSharingRecords.id, id))
      .returning()
      .execute();
    return record || null;
  }

  /**
   * 批量更新分账记录状态
   * @param ids 分账记录ID列表
   * @param status 新状态
   * @returns 更新成功的记录数
   */
  async batchUpdateProfitSharingRecordsStatus(ids: string[], status: "pending" | "completed" | "failed" | "refunded"): Promise<number> {
    const result = await db
      .update(profitSharingRecords)
      .set({ status, updatedAt: new Date() })
      .where(inArray(profitSharingRecords.id, ids))
      .execute();
    return result.rowCount ?? 0;
  }

  /**
   * 创建结算记录
   * @param data 结算记录数据
   * @param profitSharingRecordIds 关联的分账记录ID列表
   * @returns 创建的结算记录对象
   */
  async createSettlement(data: InsertSettlementRecord, profitSharingRecordIds: string[]): Promise<SettlementRecord> {
    this.logger.info('创建结算记录开始', {
      recipientId: data.recipientId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      recordCount: profitSharingRecordIds.length
    });

    const validated = insertSettlementRecordSchema.parse(data);

    // 开始事务
    return db.transaction(async (tx) => {
      // 创建结算记录
      const [settlement] = await tx.insert(settlementRecords).values(validated).returning().execute();

      // 创建结算-分账关联
      for (const recordId of profitSharingRecordIds) {
        await tx.insert(settlementProfitSharingLinks).values({
          settlementId: settlement.id,
          profitSharingRecordId: recordId,
        }).execute();
      }

      // 更新分账记录状态
      await tx
        .update(profitSharingRecords)
        .set({ status: "completed", updatedAt: new Date() })
        .where(inArray(profitSharingRecords.id, profitSharingRecordIds))
        .execute();

      this.logger.info('创建结算记录成功', {
        settlementId: settlement.id,
        recipientId: settlement.recipientId,
        amount: settlement.amount,
        recordCount: profitSharingRecordIds.length
      });

      return settlement;
    });
  }

  /**
   * 获取结算记录列表
   * @param options 查询选项
   * @returns 结算记录列表
   */
  async getSettlementRecords(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<SettlementRecord, "recipientId" | "status">>;
  } = {}): Promise<SettlementRecord[]> {
    const { skip = 0, limit = 100, filters = {} } = options;

    const conditions = [];
    if (filters.recipientId !== undefined) {
      conditions.push(eq(settlementRecords.recipientId, filters.recipientId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(settlementRecords.status, filters.status));
    }

    const query = db
      .select()
      .from(settlementRecords)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(settlementRecords.createdAt));

    return query.execute();
  }

  /**
   * 根据ID获取结算记录
   * @param id 结算记录ID
   * @returns 结算记录对象，不存在则返回null
   */
  async getSettlementRecordById(id: string): Promise<SettlementRecord | null> {
    const [settlement] = await db.select().from(settlementRecords).where(eq(settlementRecords.id, id)).execute();
    return settlement || null;
  }

  /**
   * 更新结算记录
   * @param id 结算记录ID
   * @param data 要更新的数据
   * @returns 更新后的结算记录对象，失败则返回null
   */
  async updateSettlement(id: string, data: UpdateSettlementRecord): Promise<SettlementRecord | null> {
    const validated = updateSettlementRecordSchema.parse(data);
    const [settlement] = await db
      .update(settlementRecords)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(settlementRecords.id, id))
      .returning()
      .execute();
    return settlement || null;
  }

  /**
   * 获取结算记录关联的分账记录
   * @param settlementId 结算记录ID
   * @returns 分账记录列表
   */
  async getProfitSharingRecordsBySettlementId(settlementId: string): Promise<ProfitSharingRecord[]> {
    return db
      .select({
        id: profitSharingRecords.id,
        bookingId: profitSharingRecords.bookingId,
        venueBookingId: profitSharingRecords.venueBookingId,
        tournamentParticipantId: profitSharingRecords.tournamentParticipantId,
        transactionId: profitSharingRecords.transactionId,
        amount: profitSharingRecords.amount,
        recipientId: profitSharingRecords.recipientId,
        type: profitSharingRecords.type,
        status: profitSharingRecords.status,
        ruleId: profitSharingRecords.ruleId,
        notes: profitSharingRecords.notes,
        createdAt: profitSharingRecords.createdAt,
        updatedAt: profitSharingRecords.updatedAt
      })
      .from(profitSharingRecords)
      .innerJoin(
        settlementProfitSharingLinks,
        eq(profitSharingRecords.id, settlementProfitSharingLinks.profitSharingRecordId)
      )
      .where(eq(settlementProfitSharingLinks.settlementId, settlementId))
      .execute();
  }

  /**
   * 计算分账金额
   * @param amount 总金额
   * @param percentage 分账比例
   * @param fixedAmount 固定金额
   * @param minAmount 最小分账金额
   * @param maxAmount 最大分账金额
   * @returns 计算后的分账金额
   */
  calculateProfitSharingAmount(
    amount: number,
    percentage: number,
    fixedAmount?: number,
    minAmount?: number,
    maxAmount?: number
  ): number {
    let calculatedAmount = fixedAmount ?? (amount * percentage) / 100;

    if (minAmount !== undefined && calculatedAmount < minAmount) {
      calculatedAmount = minAmount;
    }

    if (maxAmount !== undefined && calculatedAmount > maxAmount) {
      calculatedAmount = maxAmount;
    }

    return Math.round(calculatedAmount * 100) / 100; // 四舍五入到两位小数
  }

  /**
   * 批量创建结算记录
   * @param recipientId 接收方ID
   * @param profitSharingRecordIds 待结算的分账记录ID列表
   * @param paymentMethod 支付方式
   * @returns 创建的结算记录对象
   */
  async batchCreateSettlement(
    recipientId: string,
    profitSharingRecordIds: string[],
    paymentMethod: string
  ): Promise<SettlementRecord> {
    // 获取待结算的分账记录
    const profitSharingRecords = await this.getProfitSharingRecords({
      filters: {
        recipientId,
        status: "pending"
      }
    });
    
    // 过滤出指定的分账记录
    const filteredRecords = profitSharingRecords.filter(record => 
      profitSharingRecordIds.includes(record.id)
    );
    
    if (filteredRecords.length === 0) {
      throw new Error("没有找到待结算的分账记录");
    }
    
    // 计算总结算金额
    const totalAmount = filteredRecords.reduce((sum, record) => {
      return sum + parseFloat(record.amount || "0");
    }, 0);
    
    // 创建结算记录
    return this.createSettlement(
      {
        recipientId,
        amount: totalAmount.toFixed(2),
        status: "pending",
        paymentMethod,
        notes: `批量结算 ${filteredRecords.length} 条分账记录`
      },
      filteredRecords.map(record => record.id)
    );
  }

  /**
   * 处理手动转账
   * @param settlementId 结算记录ID
   * @param transactionId 交易ID
   * @returns 更新后的结算记录对象
   */
  async processManualTransfer(
    settlementId: string,
    transactionId: string
  ): Promise<SettlementRecord | null> {
    this.logger.info('处理手动转账开始', {
      settlementId,
      transactionId
    });
    
    try {
      // 更新结算记录状态
      const updatedSettlement = await this.updateSettlement(settlementId, {
        status: "completed",
        transactionId,
        settlementDate: new Date()
      });
      
      if (updatedSettlement) {
        this.logger.info('处理手动转账成功', {
          settlementId: updatedSettlement.id,
          recipientId: updatedSettlement.recipientId,
          amount: updatedSettlement.amount,
          transactionId
        });
      } else {
        this.logger.warn('处理手动转账失败：结算记录不存在', {
          settlementId
        });
      }
      
      return updatedSettlement;
    } catch (error: any) {
      this.logger.error('处理手动转账失败', {
        error: error.message,
        settlementId
      }, error);
      throw error;
    }
  }

  /**
   * 获取待结算的分账记录
   * @param recipientId 接收方ID
   * @param minAmount 最小金额
   * @returns 待结算的分账记录列表
   */
  async getPendingProfitSharingRecords(
    recipientId?: string,
    minAmount?: number
  ): Promise<ProfitSharingRecord[]> {
    const conditions = [eq(profitSharingRecords.status, "pending")];
    
    if (recipientId) {
      conditions.push(eq(profitSharingRecords.recipientId, recipientId));
    }
    
    if (minAmount) {
      conditions.push(sql`${profitSharingRecords.amount} >= ${minAmount}`);
    }
    
    return db
      .select()
      .from(profitSharingRecords)
      .where(and(...conditions))
      .orderBy(desc(profitSharingRecords.createdAt))
      .execute();
  }

  /**
   * 取消结算
   * @param settlementId 结算记录ID
   * @returns 是否取消成功
   */
  async cancelSettlement(settlementId: string): Promise<boolean> {
    this.logger.info('取消结算开始', {
      settlementId
    });
    
    // 开始事务
    return db.transaction(async (tx) => {
      // 更新结算记录状态
      await tx
        .update(settlementRecords)
        .set({ 
          status: "failed",
          updatedAt: new Date(),
          notes: "结算已取消"
        })
        .where(eq(settlementRecords.id, settlementId))
        .execute();
      
      // 获取关联的分账记录
      const links = await tx
        .select({ profitSharingRecordId: settlementProfitSharingLinks.profitSharingRecordId })
        .from(settlementProfitSharingLinks)
        .where(eq(settlementProfitSharingLinks.settlementId, settlementId))
        .execute();
      
      // 更新分账记录状态为待结算
      if (links.length > 0) {
        const recordIds = links.map(link => link.profitSharingRecordId);
        await tx
          .update(profitSharingRecords)
          .set({ 
            status: "pending",
            updatedAt: new Date()
          })
          .where(inArray(profitSharingRecords.id, recordIds))
          .execute();
        
        this.logger.info('取消结算成功，已恢复分账记录状态', {
          settlementId,
          recordCount: recordIds.length
        });
      } else {
        this.logger.info('取消结算成功，无关联分账记录', {
          settlementId
        });
      }
      
      return true;
    });
  }

  /**
   * 获取接收方的结算统计
   * @param recipientId 接收方ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 结算统计信息
   */
  async getSettlementStatistics(
    recipientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalPending: number;
    totalCompleted: number;
    pendingAmount: number;
    completedAmount: number;
  }> {
    // 构建待结算记录查询条件
    const pendingConditions = [
      eq(profitSharingRecords.recipientId, recipientId),
      eq(profitSharingRecords.status, "pending")
    ];
    
    // 构建已结算记录查询条件
    const completedConditions = [
      eq(settlementRecords.recipientId, recipientId),
      eq(settlementRecords.status, "completed")
    ];
    
    // 添加日期条件
    if (startDate && endDate) {
      pendingConditions.push(sql`${profitSharingRecords.createdAt} >= ${startDate}`);
      pendingConditions.push(sql`${profitSharingRecords.createdAt} <= ${endDate}`);
      
      completedConditions.push(sql`${settlementRecords.createdAt} >= ${startDate}`);
      completedConditions.push(sql`${settlementRecords.createdAt} <= ${endDate}`);
    }
    
    // 执行查询
    const [pendingResult] = await db
      .select({
        total: sql`COUNT(*)`,
        amount: sql`SUM(${profitSharingRecords.amount})`
      })
      .from(profitSharingRecords)
      .where(and(...pendingConditions));
    
    const [completedResult] = await db
      .select({
        total: sql`COUNT(*)`,
        amount: sql`SUM(${settlementRecords.amount})`
      })
      .from(settlementRecords)
      .where(and(...completedConditions));
    
    return {
      totalPending: Number(pendingResult?.total || 0),
      totalCompleted: Number(completedResult?.total || 0),
      pendingAmount: Number(pendingResult?.amount || 0),
      completedAmount: Number(completedResult?.amount || 0)
    };
  }
}

export const profitSharingManager = new ProfitSharingManager();
