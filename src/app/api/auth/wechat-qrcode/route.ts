/**
 * 微信扫码登录 - 生成小程序码
 * POST /api/auth/wechat-qrcode
 *
 * 流程：
 * 1. 生成唯一 session_id (uuid)
 * 2. 在内存中存储状态 { status: 'waiting', createdAt, openid?: null }
 * 3. 调用微信 getUnlimitedQRCode 接口生成小程序码（scene=session_id）
 * 4. 返回 base64 图片数据 + session_id
 *
 * 小程序端扫码后会带着 scene 参数启动，
 * 小程序再调 wechat-login API 把 scene 和 openid 传过来
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { qrSessions } from '@/lib/wechat-sessions';
import type { WechatQrSession } from '@/lib/wechat-sessions';

export async function POST(request: NextRequest) {
  try {
    const sessionId = crypto.randomUUID();

    // 存储等待中的会话
    qrSessions.set(sessionId, {
      status: 'waiting',
      createdAt: Date.now(),
    });

    // 尝试调用微信接口生成小程序码
    let qrcodeBase64 = '';
    try {
      // 如果配置了微信凭证，调用真实接口
      if (process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET) {
        // 获取 access_token
        const tokenRes = await fetch(
          `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}`
        );
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          throw new Error(`获取 access_token 失败: ${tokenData.errmsg || 'unknown error'}`);
        }

        // 调用微信 getUnlimitedQRCode
        const wxRes = await fetch(
          `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scene: sessionId,
              page: 'pages/login/index', // 小程序登录页路径
              width: 280,
              auto_color: false,
              line_color: { r: 0, g: 128, b: 64 }, // emerald green
              is_hyaline: true,
            }),
          }
        );

        if (wxRes.ok) {
          const buffer = Buffer.from(await wxRes.arrayBuffer());
          qrcodeBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
        } else {
          throw new Error('Failed to generate QR code from WeChat');
        }
      } else {
        throw new Error('WeChat credentials not configured');
      }
    } catch (wechatError) {
      console.warn('[WeChat QR] 无法生成真实二维码，使用占位图:', wechatError);

      // 开发环境生成一个简单的 SVG 占位二维码
      const svgPlaceholder = `
        <svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
          <rect width="280" height="280" fill="#f8fafc" rx="16"/>
          <rect x="40" y="40" width="200" height="200" fill="#059669" rx="12"/>
          <text x="140" y="130" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif">📱</text>
          <text x="140" y="170" text-anchor="middle" fill="white" font-size="14" font-family="sans-serif">微信扫码登录</text>
          <text x="140" y="195" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11" font-family="sans-serif">请使用微信扫描</text>
        </svg>
      `;
      qrcodeBase64 = `data:image/svg+xml;base64,${Buffer.from(svgPlaceholder).toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        qrcode: qrcodeBase64,
        expiresIn: 300, // 5分钟
      },
    });
  } catch (error: any) {
    console.error('Generate QR code error:', error);
    return NextResponse.json(
      { success: false, error: '生成二维码失败' },
      { status: 500 }
    );
  }
}
