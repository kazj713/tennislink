import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  matchups,
  insertMatchupSchema,
  updateMatchupSchema,
  matchupParticipants,
  insertMatchupParticipantSchema,
} from "./shared/schema";
import type {
  Matchup,
  InsertMatchup,
  UpdateMatchup,
  MatchupParticipant,
  InsertMatchupParticipant,
} from "./shared/schema";

export class MatchupManager {
  // ==================== 约球相关 ====================

  async createMatchup(data: InsertMatchup): Promise<Matchup> {
    const db = await getDb();
    const validated = insertMatchupSchema.parse(data);
    const [matchup] = await db.insert(matchups).values(validated).returning();
    return matchup;
  }

  async getMatchups(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<Matchup, "id" | "creatorId" | "venueId" | "status" | "skillLevel">>;
  } = {}): Promise<Matchup[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(matchups.id, filters.id));
    }
    if (filters.creatorId !== undefined) {
      conditions.push(eq(matchups.creatorId, filters.creatorId));
    }
    if (filters.venueId !== undefined && filters.venueId !== null) {
      conditions.push(eq(matchups.venueId, filters.venueId));
    }
    if (filters.status !== undefined) {
      conditions.push(eq(matchups.status, filters.status));
    }
    if (filters.skillLevel !== undefined && filters.skillLevel !== null) {
      conditions.push(eq(matchups.skillLevel, filters.skillLevel));
    }

    const query = db
      .select()
      .from(matchups)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(matchups.scheduledDate));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  async getMatchupById(id: string): Promise<Matchup | null> {
    const db = await getDb();
    const [matchup] = await db.select().from(matchups).where(eq(matchups.id, id));
    return matchup || null;
  }

  async updateMatchup(id: string, data: UpdateMatchup): Promise<Matchup | null> {
    const db = await getDb();
    const validated = updateMatchupSchema.parse(data);
    const [matchup] = await db
      .update(matchups)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(matchups.id, id))
      .returning();
    return matchup || null;
  }

  async deleteMatchup(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(matchups).where(eq(matchups.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ==================== 约球参与者相关 ====================

  async addParticipant(data: InsertMatchupParticipant): Promise<MatchupParticipant> {
    const db = await getDb();
    const validated = insertMatchupParticipantSchema.parse(data);
    const [participant] = await db.insert(matchupParticipants).values(validated).returning();

    // 更新约球当前人数
    await db
      .update(matchups)
      .set({ currentPlayers: sql`${matchups.currentPlayers} + 1` })
      .where(eq(matchups.id, data.matchupId));

    return participant;
  }

  async getParticipants(matchupId: string): Promise<MatchupParticipant[]> {
    const db = await getDb();
    return db
      .select()
      .from(matchupParticipants)
      .where(eq(matchupParticipants.matchupId, matchupId))
      .orderBy(matchupParticipants.createdAt);
  }

  async removeParticipant(matchupId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(matchupParticipants)
      .where(and(eq(matchupParticipants.matchupId, matchupId), eq(matchupParticipants.userId, userId)));

    if ((result.rowCount ?? 0) > 0) {
      // 更新约球当前人数
      await db
        .update(matchups)
        .set({ currentPlayers: sql`${matchups.currentPlayers} - 1` })
        .where(eq(matchups.id, matchupId));
      return true;
    }

    return false;
  }

  async checkParticipant(matchupId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const [participant] = await db
      .select()
      .from(matchupParticipants)
      .where(and(eq(matchupParticipants.matchupId, matchupId), eq(matchupParticipants.userId, userId)));
    return !!participant;
  }
}

export const matchupManager = new MatchupManager();
