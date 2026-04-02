/**
 * 证书管理器
 * 处理教练证书的存储和管理
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  coachCertifications,
  insertCoachCertificationSchema,
  updateCoachCertificationSchema,
  type CoachCertification,
  type InsertCoachCertification,
  type UpdateCoachCertification,
} from "./shared/schema";
import { deleteFile, isStorageAvailable } from "@/lib/storage";

export interface CertificationRecord {
  id?: string;
  userId: string;
  type: 'professional' | 'safety' | 'coach' | 'experience';
  fileKey: string;
  fileName: string;
  uploadTime: Date;
  status: 'pending_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
}

/**
 * 保存证书记录
 */
export async function saveCertificationRecord(certification: InsertCoachCertification): Promise<boolean> {
  try {
    const db = await getDb();
    const validated = insertCoachCertificationSchema.parse(certification);
    
    const [result] = await db
      .insert(coachCertifications)
      .values({
        ...validated,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    console.log('证书记录保存成功:', result.id);
    return !!result;
  } catch (error) {
    console.error('保存证书记录失败:', error);
    return false;
  }
}

/**
 * 获取用户的证书列表
 */
export async function getUserCertifications(userId: string): Promise<CoachCertification[]> {
  try {
    const db = await getDb();
    
    const results = await db
      .select()
      .from(coachCertifications)
      .where(eq(coachCertifications.userId, userId))
      .orderBy(desc(coachCertifications.createdAt));
    
    console.log(`获取用户 ${userId} 的证书列表，共 ${results.length} 个证书`);
    return results;
  } catch (error) {
    console.error('获取用户证书列表失败:', error);
    return [];
  }
}

/**
 * 获取证书详情
 */
export async function getCertificationById(certificationId: string): Promise<CoachCertification | null> {
  try {
    const db = await getDb();
    
    const [result] = await db
      .select()
      .from(coachCertifications)
      .where(eq(coachCertifications.id, certificationId));
    
    return result || null;
  } catch (error) {
    console.error('获取证书详情失败:', error);
    return null;
  }
}

/**
 * 更新证书审核状态
 */
export async function updateCertificationStatus(
  certificationId: string,
  status: 'approved' | 'rejected',
  reviewComment?: string,
  reviewedBy?: string
): Promise<boolean> {
  try {
    const db = await getDb();
    
    const updateData: UpdateCoachCertification = {
      status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewComment,
      rejectionReason: status === 'rejected' ? reviewComment : undefined,
    };
    
    const validated = updateCoachCertificationSchema.parse(updateData);
    
    const [result] = await db
      .update(coachCertifications)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(coachCertifications.id, certificationId))
      .returning();
    
    console.log(`证书 ${certificationId} 状态更新为: ${status}`);
    return !!result;
  } catch (error) {
    console.error('更新证书状态失败:', error);
    return false;
  }
}

/**
 * 删除证书
 */
export async function deleteCertification(certificationId: string): Promise<boolean> {
  try {
    const db = await getDb();
    
    // 先获取证书信息（用于删除文件）
    const cert = await getCertificationById(certificationId);
    if (!cert) {
      console.warn(`证书 ${certificationId} 不存在`);
      return false;
    }
    
    // 检查存储服务是否可用
    const storageAvailable = isStorageAvailable();
    
    // 从存储删除文件（如果配置了存储服务）
    if (storageAvailable && cert.fileKey) {
      try {
        console.log(`[证书删除] 正在删除存储文件: ${cert.fileKey}`);
        const deleteResult = await deleteFile(cert.fileKey);
        
        if (deleteResult.success) {
          console.log(`[证书删除] 存储文件删除成功: ${cert.fileKey}`);
        } else {
          console.warn(`[证书删除] 存储文件删除失败: ${deleteResult.error}`);
          // 继续删除数据库记录，即使文件删除失败
        }
      } catch (error) {
        console.error(`[证书删除] 删除存储文件时出错:`, error);
        // 继续删除数据库记录，即使文件删除失败
      }
    } else {
      if (!storageAvailable) {
        console.warn(`[证书删除] 存储服务未配置，跳过文件删除`);
      } else {
        console.warn(`[证书删除] 证书没有 fileKey，跳过文件删除`);
      }
    }
    
    // 从数据库删除记录
    const result = await db
      .delete(coachCertifications)
      .where(eq(coachCertifications.id, certificationId));
    
    console.log(`[证书删除] 证书 ${certificationId} 已从数据库删除`);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('删除证书失败:', error);
    return false;
  }
}

/**
 * 获取待审核的证书列表（管理员使用）
 */
export async function getPendingCertifications(limit: number = 50): Promise<CoachCertification[]> {
  try {
    const db = await getDb();
    
    const results = await db
      .select()
      .from(coachCertifications)
      .where(eq(coachCertifications.status, 'pending_review'))
      .orderBy(desc(coachCertifications.createdAt))
      .limit(limit);
    
    console.log(`获取待审核证书列表，共 ${results.length} 个`);
    return results;
  } catch (error) {
    console.error('获取待审核证书列表失败:', error);
    return [];
  }
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
