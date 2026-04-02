/**
 * 微信登录API
 * 处理微信小程序的登录请求
 */
import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';
import { sign } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getWechatSession, validateWechatUserInfo } from '@/lib/wechat';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/auth/wechat-login
 * 微信登录接口
 * 请求体:
 * {
 *   "code": "微信登录code",
 *   "userInfo": {"nickName": "昵称", "avatarUrl": "头像URL"},
 *   "userType": "student" | "coach"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userInfo, userType } = body;
    
    // 验证必填参数
    if (!code) {
      return NextResponse.json(
        { error: '请提供微信登录code' },
        { status: 400 }
      );
    }
    
    // 验证userType
    if (!['student', 'coach'].includes(userType)) {
      return NextResponse.json(
        { error: '无效的用户类型' },
        { status: 400 }
      );
    }
    
    // 1. 调用微信API获取openid和session_key
    let wechatSession;
    try {
      wechatSession = await getWechatSession(code);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : '微信登录失败' },
        { status: 400 }
      );
    }

    const openid = wechatSession.openid;
    const sessionKey = wechatSession.session_key;
    
    // 2. 根据openid查询用户是否已存在
    let user = await userManager.findByWechatOpenid(openid);
    
    if (!user) {
      // 3. 验证微信用户信息
    let validatedUserInfo = null;
    if (userInfo) {
      validatedUserInfo = validateWechatUserInfo(userInfo);
    }

    // 4. 如果用户不存在，创建新用户
    const userData = {
      name: validatedUserInfo?.nickName || `微信用户_${openid.slice(-8)}`,
      email: `${openid}@wechat.com`,
      phone: null,
      password: null, // 微信登录不需要密码
      role: userType,
      avatar: validatedUserInfo?.avatarUrl || userInfo?.avatarUrl,
      wechatOpenid: openid,
    };
      
      user = await userManager.create(userData);
    }
    
    // 5. 生成JWT token
    const token = sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 6. 设置cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
    });
    
    // 7. 移除密码字段
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      message: '微信登录成功'
    });
    
  } catch (error: any) {
    console.error('Wechat login error:', error);
    return NextResponse.json(
      { error: '微信登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
