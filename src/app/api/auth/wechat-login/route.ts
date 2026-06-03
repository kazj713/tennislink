/**
 * 微信扫码登录 - 小程序端回调
 * POST /api/auth/wechat-login
 *
 * 由微信小程序端调用，携带 scene(=sessionId) 和 code
 *
 * 流程：
 * 1. 用 code 换取 openid/session_key
 * 2. 根据 scene 找到对应的 QR 会话
 * 3. 更新会话状态为 confirmed
 * 4. 查找或创建用户账号
 * 5. 生成 JWT Token
 * 6. 将 token 写入会话，供前端轮询获取
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateJWTToken } from '@/lib/security';
import { userManager } from '@/storage/database/userManager';
import { qrSessions } from '@/lib/wechat-sessions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scene, code } = body;

    if (!scene || !code) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 查找对应的扫码会话
    const session = qrSessions.get(scene);
    if (!session || session.status === 'expired') {
      return NextResponse.json(
        { success: false, error: '二维码已过期或不存在' },
        { status: 400 }
      );
    }

    if (session.status !== 'waiting') {
      return NextResponse.json(
        { success: false, error: '该二维码已被使用' },
        { status: 400 }
      );
    }

    // 用 code 换取 openid
    let openid: string | null = null;
    let unionid: string | null = null;

    try {
      if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
        // 开发模式模拟
        console.warn('[WeChat Login] 未配置微信凭证，使用开发模式');
        openid = `dev_openid_${scene}`;
        unionid = null;
      } else {
        const wxRes = await fetch(
          `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
        );
        const wxData = await wxRes.json();

        if (wxData.errcode) {
          throw new Error(wxData.errmsg || '微信授权失败');
        }

        openid = wxData.openid;
        unionid = wxData.unionid || null;
      }
    } catch (error: any) {
      console.error('WeChat code exchange failed:', error);
      return NextResponse.json(
        { success: false, error: '微信授权失败，请重试' },
        { status: 400 }
      );
    }

    // 标记为已扫码
    session.status = 'scanned';
    session.openid = openid;
    session.unionid = unionid;

    // 查找或创建用户
    let user;
    try {
      if (!openid) {
        throw new Error('未能获取 openid');
      }

      // 先尝试按 openid 查找
      user = await userManager.findByWechatOpenid(openid);

      if (!user) {
        // 新用户自动注册（复用原有 wechat-login 的用户创建逻辑）
        user = await userManager.create({
          name: `微信用户_${openid.slice(-8)}`,
          email: `${openid}@wechat.com`,
          phone: null,
          password: null,
          role: 'student',
          avatar: null,
          wechatOpenid: openid,
        } as Parameters<typeof userManager.create>[0]);
      }
    } catch (createError: any) {
      console.error('User create/find failed:', createError);
      session.status = 'failed';
      return NextResponse.json(
        { success: false, error: '用户创建失败' },
        { status: 500 }
      );
    }

    // 生成 JWT Token
    const token = generateJWTToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // 更新会话为已确认
    session.status = 'confirmed';
    session.userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      token,
    };

    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error: any) {
    console.error('WeChat login error:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
