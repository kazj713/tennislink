/**
 * 微信扫码登录 - 状态轮询/回调
 * GET /api/auth/wechat-callback?sessionId=xxx
 *
 * 返回当前扫码状态：
 * - waiting: 等待扫码
 * - scanned: 已扫码待确认
 * - confirmed: 已确认，附带 token 和用户信息
 * - expired: 二维码已过期
 */
import { NextRequest, NextResponse } from 'next/server';
import { qrSessions } from '@/lib/wechat-sessions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: '缺少 sessionId' }, { status: 400 });
    }

    const session = qrSessions.get(sessionId);

    if (!session) {
      return NextResponse.json({
        success: true,
        data: { status: 'expired', message: '会话不存在或已过期' },
      });
    }

    // 检查是否超时（5分钟）
    if (Date.now() - session.createdAt > 5 * 60 * 1000) {
      session.status = 'expired';
      qrSessions.delete(sessionId);
      return NextResponse.json({
        success: true,
        data: { status: 'expired', message: '二维码已过期，请刷新' },
      });
    }

    const response: Record<string, any> = {
      success: true,
      data: { status: session.status },
    };

    // 如果已确认，返回 token 和用户信息
    if (session.status === 'confirmed' && session.userInfo) {
      response.data.user = session.userInfo;
      response.data.token = session.userInfo.token; // token 在确认时由 wechat-login 写入

      // 清理会话
      qrSessions.delete(sessionId);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('WeChat callback error:', error);
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    );
  }
}
