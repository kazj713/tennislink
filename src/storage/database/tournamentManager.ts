import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "./instance";
import {
  tournaments,
  insertTournamentSchema,
  updateTournamentSchema,
  tournamentParticipants,
  insertTournamentParticipantSchema,
  updateTournamentParticipantSchema,
} from "./shared/schema";
import type {
  Tournament,
  InsertTournament,
  UpdateTournament,
  TournamentParticipant,
  InsertTournamentParticipant,
  UpdateTournamentParticipant,
} from "./shared/schema";

export class TournamentManager {
  // ==================== 赛事相关 ====================

  async createTournament(data: InsertTournament): Promise<Tournament> {
    const db = await getDb();
    const validated = insertTournamentSchema.parse(data);
    const [tournament] = await db.insert(tournaments).values(validated).returning();
    return tournament;
  }

  async getTournaments(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Tournament, "id" | "venueId" | "status" | "category" | "type">>;
  } = {}): Promise<Tournament[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(tournaments.id, filters.id));
    }
    if (filters.venueId !== undefined && filters.venueId !== null) {
      conditions.push(eq(tournaments.venueId, filters.venueId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(tournaments.status, filters.status));
    }
    if (filters.category !== undefined && filters.category !== null) {
      conditions.push(eq(tournaments.category, filters.category));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(tournaments.type, filters.type));
    }

    const query = db
      .select()
      .from(tournaments)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(tournaments.startDate));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  async getTournamentById(id: string): Promise<Tournament | null> {
    const db = await getDb();
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || null;
  }

  async updateTournament(id: string, data: UpdateTournament): Promise<Tournament | null> {
    const db = await getDb();
    const validated = updateTournamentSchema.parse(data);
    const [tournament] = await db
      .update(tournaments)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(tournaments.id, id))
      .returning();
    return tournament || null;
  }

  async deleteTournament(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(tournaments).where(eq(tournaments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ==================== 赛事参与者相关 ====================

  async addParticipant(data: InsertTournamentParticipant): Promise<TournamentParticipant> {
    const db = await getDb();
    const validated = insertTournamentParticipantSchema.parse(data);
    const [participant] = await db.insert(tournamentParticipants).values(validated).returning();

    // 更新赛事当前参与人数
    await db
      .update(tournaments)
      .set({ currentParticipants: sql`${tournaments.currentParticipants} + 1` })
      .where(eq(tournaments.id, data.tournamentId));

    return participant;
  }

  async getParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    const db = await getDb();
    return db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId))
      .orderBy(tournamentParticipants.registrationDate);
  }

  async updateParticipant(id: string, data: UpdateTournamentParticipant): Promise<TournamentParticipant | null> {
    const db = await getDb();
    const validated = updateTournamentParticipantSchema.parse(data);
    const [participant] = await db
      .update(tournamentParticipants)
      .set(validated)
      .where(eq(tournamentParticipants.id, id))
      .returning();
    return participant || null;
  }

  async removeParticipant(tournamentId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(tournamentParticipants)
      .where(
        and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.userId, userId))
      );

    if ((result.rowCount ?? 0) > 0) {
      // 更新赛事当前参与人数
      await db
        .update(tournaments)
        .set({ currentParticipants: sql`${tournaments.currentParticipants} - 1` })
        .where(eq(tournaments.id, tournamentId));
      return true;
    }

    return false;
  }

  async checkParticipant(tournamentId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const [participant] = await db
      .select()
      .from(tournamentParticipants)
      .where(
        and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.userId, userId))
      );
    return !!participant;
  }

  /**
   * 赛事报名
   * @param tournamentId 赛事ID
   * @param data 报名数据
   * @returns 报名记录
   */
  async register(tournamentId: string, data: {
    userId: string;
    paymentAmount?: number;
    transactionId?: string;
  }): Promise<TournamentParticipant> {
    const db = await getDb();
    
    // 检查赛事是否存在
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) {
      throw new Error('赛事不存在');
    }
    
    // 检查报名是否已截止
    if (new Date() > new Date(tournament.registrationDeadline)) {
      throw new Error('赛事报名已截止');
    }
    
    // 检查是否已满员
    if ((tournament.currentParticipants || 0) >= tournament.maxParticipants) {
      throw new Error('赛事已满员');
    }
    
    // 检查用户是否已报名
    if (await this.checkParticipant(tournamentId, data.userId)) {
      throw new Error('您已报名该赛事');
    }
    
    // 创建报名记录
    const participant = await this.addParticipant({
      tournamentId,
      userId: data.userId,
      paymentAmount: (data.paymentAmount || 0).toString(),
      transactionId: data.transactionId || null
    });
    
    return participant;
  }
}

export const tournamentManager = new TournamentManager();
