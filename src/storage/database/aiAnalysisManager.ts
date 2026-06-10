import { eq, and, SQL, desc } from "drizzle-orm";
import { getDb } from "./instance";
import {
  aiAnalysisRecords,
  insertAiAnalysisRecordSchema,
} from "./shared/schema";
import type {
  AiAnalysisRecord,
  InsertAiAnalysisRecord,
} from "./shared/schema";

export class AiAnalysisManager {
  async createAnalysis(data: InsertAiAnalysisRecord): Promise<AiAnalysisRecord> {
    const db = await getDb();
    const validated = insertAiAnalysisRecordSchema.parse(data);
    const [record] = await db.insert(aiAnalysisRecords).values(validated).returning();
    return record;
  }

  async getAnalyses(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<AiAnalysisRecord, "id" | "userId" | "coachId">>;
  } = {}): Promise<AiAnalysisRecord[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(aiAnalysisRecords.id, filters.id));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(aiAnalysisRecords.userId, filters.userId));
    }
    if (filters.coachId !== undefined && filters.coachId !== null) {
      conditions.push(eq(aiAnalysisRecords.coachId, filters.coachId));
    }

    const query = db
      .select()
      .from(aiAnalysisRecords)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(aiAnalysisRecords.createdAt));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  async getAnalysisById(id: string): Promise<AiAnalysisRecord | null> {
    const db = await getDb();
    const [record] = await db.select().from(aiAnalysisRecords).where(eq(aiAnalysisRecords.id, id));
    return record || null;
  }

  async updateAnalysis(id: string, data: Partial<InsertAiAnalysisRecord>): Promise<AiAnalysisRecord | null> {
    const db = await getDb();
    const [record] = await db
      .update(aiAnalysisRecords)
      .set(data)
      .where(eq(aiAnalysisRecords.id, id))
      .returning();
    return record || null;
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(aiAnalysisRecords).where(eq(aiAnalysisRecords.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取用户的AI分析记录
   */
  async getUserAnalyses(userId: string, limit: number = 20): Promise<AiAnalysisRecord[]> {
    const db = await getDb();
    return db
      .select()
      .from(aiAnalysisRecords)
      .where(eq(aiAnalysisRecords.userId, userId))
      .orderBy(desc(aiAnalysisRecords.createdAt))
      .limit(limit);
  }

  /**
   * 获取教练关联的分析记录
   */
  async getCoachAnalyses(coachId: string, limit: number = 20): Promise<AiAnalysisRecord[]> {
    const db = await getDb();
    return db
      .select()
      .from(aiAnalysisRecords)
      .where(eq(aiAnalysisRecords.coachId, coachId))
      .orderBy(desc(aiAnalysisRecords.createdAt))
      .limit(limit);
  }

  /**
   * 更新分析结果
   */
  async updateAnalysisResult(id: string, result: any, suggestions: string, score: number): Promise<boolean> {
    const db = await getDb();
    const [updated] = await db
      .update(aiAnalysisRecords)
      .set({
        analysisResult: result,
        improvementSuggestions: suggestions,
        score: score,
      })
      .where(eq(aiAnalysisRecords.id, id))
      .returning();
    return !!updated;
  }

  /**
   * 别名方法：create（兼容旧API）
   */
  async create(data: InsertAiAnalysisRecord): Promise<AiAnalysisRecord> {
    return this.createAnalysis(data);
  }

  /**
   * 别名方法：findByUserId（兼容旧API）
   */
  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<AiAnalysisRecord[]> {
    const skip = (page - 1) * limit;
    return this.getAnalyses({ filters: { userId }, skip, limit });
  }
}

export const aiAnalysisManager = new AiAnalysisManager();
