/**
 * 微信扫码登录会话存储（共享模块）
 *
 * 在 Next.js App Router 中，route.ts 文件之间不能直接相互导入，
 * 因此将 qrSessions 提取到独立的共享模块中。
 */
import crypto from 'crypto';

export interface WechatQrSession {
  status: 'waiting' | 'scanned' | 'confirmed' | 'expired' | 'failed';
  createdAt: number;
  openid?: string | null;
  unionid?: string | null;
  userInfo?: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
    token: string;
  };
}

// 简单内存存储（生产环境应使用 Redis）
export const qrSessions = new Map<string, WechatQrSession>();

// 清理过期会话（5分钟过期）
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, session] of qrSessions.entries()) {
      if (now - session.createdAt > 5 * 60 * 1000) {
        session.status = 'expired';
        qrSessions.delete(key);
      }
    }
  }, 60000);
}
