/**
 * 证书管理器（兼容层）
 * 处理教练证书的存储和管理
 * 已迁移到：src/storage/database/certificationManager.ts
 */

import {
  saveCertificationRecord as dbSaveCertificationRecord,
  getUserCertifications as dbGetUserCertifications,
  updateCertificationStatus as dbUpdateCertificationStatus,
  deleteCertification as dbDeleteCertification,
  type CertificationRecord,
} from '@/storage/database/certificationManager';

// 重新导出类型和函数，保持向后兼容
export type { CertificationRecord };

/**
 * 保存证书记录
 */
export async function saveCertificationRecord(certification: CertificationRecord): Promise<boolean> {
  return dbSaveCertificationRecord(certification as any);
}

/**
 * 获取用户的证书列表
 */
export async function getUserCertifications(userId: string): Promise<CertificationRecord[]> {
  return dbGetUserCertifications(userId) as any;
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
  return dbUpdateCertificationStatus(certificationId, status, reviewComment, reviewedBy);
}

/**
 * 删除证书
 */
export async function deleteCertification(certificationId: string): Promise<boolean> {
  return dbDeleteCertification(certificationId);
}