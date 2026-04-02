import { eq, and, SQL, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  communityPosts,
  insertCommunityPostSchema,
  updateCommunityPostSchema,
  communityComments,
  insertCommunityCommentSchema,
  communityLikes,
  insertCommunityLikeSchema,
} from "./shared/schema";
import type {
  CommunityPost,
  InsertCommunityPost,
  UpdateCommunityPost,
  CommunityComment,
  InsertCommunityComment,
  CommunityLike,
  InsertCommunityLike,
} from "./shared/schema";

/**
 * 社区管理器
 * 负责社区动态、评论、点赞相关的数据库操作
 */
export class CommunityManager {
  // ==================== 动态相关 ====================

  /**
   * 创建社区动态
   * @param data 动态数据（必须包含userId、content、type等字段）
   * @returns 创建的动态对象
   */
  async createPost(data: InsertCommunityPost): Promise<CommunityPost> {
    const db = await getDb();
    const validated = insertCommunityPostSchema.parse(data);
    const [post] = await db.insert(communityPosts).values(validated).returning();
    return post;
  }

  async getPosts(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<CommunityPost, "id" | "userId" | "type">>;
  } = {}): Promise<CommunityPost[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];

    if (filters.id !== undefined) {
      conditions.push(eq(communityPosts.id, filters.id));
    }
    if (filters.userId !== undefined) {
      conditions.push(eq(communityPosts.userId, filters.userId));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(communityPosts.type, filters.type));
    }

    const query = db
      .select()
      .from(communityPosts)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(communityPosts.createdAt));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  }

  async getPostById(id: string): Promise<CommunityPost | null> {
    const db = await getDb();
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post || null;
  }

  async updatePost(id: string, data: UpdateCommunityPost): Promise<CommunityPost | null> {
    const db = await getDb();
    const validated = updateCommunityPostSchema.parse(data);
    const [post] = await db
      .update(communityPosts)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(communityPosts.id, id))
      .returning();
    return post || null;
  }

  async deletePost(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(communityPosts).where(eq(communityPosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ==================== 评论相关 ====================

  async createComment(data: InsertCommunityComment): Promise<CommunityComment> {
    const db = await getDb();
    const validated = insertCommunityCommentSchema.parse(data);
    const [comment] = await db.insert(communityComments).values(validated).returning() as any;

    // 更新帖子评论数
    await db
      .update(communityPosts)
      .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
      .where(eq(communityPosts.id, data.postId));

    return comment;
  }

  async getComments(postId: string): Promise<CommunityComment[]> {
    const db = await getDb();
    return db
      .select()
      .from(communityComments)
      .where(eq(communityComments.postId, postId))
      .orderBy(communityComments.createdAt);
  }

  async deleteComment(id: string): Promise<boolean> {
    const db = await getDb();
    const [comment] = await db.select().from(communityComments).where(eq(communityComments.id, id));

    if (comment) {
      await db.delete(communityComments).where(eq(communityComments.id, id));
      // 更新帖子评论数
      await db
        .update(communityPosts)
        .set({ commentCount: sql`${communityPosts.commentCount} - 1` })
        .where(eq(communityPosts.id, comment.postId));
      return true;
    }

    return false;
  }

  // ==================== 点赞相关 ====================

  async createLike(data: InsertCommunityLike): Promise<CommunityLike> {
    const db = await getDb();
    const validated = insertCommunityLikeSchema.parse(data);
    const [like] = await db.insert(communityLikes).values(validated).returning();

    // 更新帖子点赞数
    await db
      .update(communityPosts)
      .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
      .where(eq(communityPosts.id, data.postId));

    return like;
  }

  async deleteLike(postId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .delete(communityLikes)
      .where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));

    if ((result.rowCount ?? 0) > 0) {
      // 更新帖子点赞数
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} - 1` })
        .where(eq(communityPosts.id, postId));
      return true;
    }

    return false;
  }

  async checkUserLiked(postId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    const [like] = await db
      .select()
      .from(communityLikes)
      .where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));
    return !!like;
  }

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    
    // 检查用户是否已点赞
    const liked = await this.checkUserLiked(postId, userId);
    
    if (liked) {
      // 已点赞，取消点赞
      await db
        .delete(communityLikes)
        .where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));
      
      // 更新帖子点赞数
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} - 1` })
        .where(eq(communityPosts.id, postId));
      
      return false;
    } else {
      // 未点赞，添加点赞
      await db
        .insert(communityLikes)
        .values({ postId, userId });
      
      // 更新帖子点赞数
      await db
        .update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
        .where(eq(communityPosts.id, postId));
      
      return true;
    }
  }
}

export const communityManager = new CommunityManager();
