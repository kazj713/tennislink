/**
 * 微信API服务
 * 处理微信小程序登录、获取用户信息等
 */

export interface WechatSession {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatUserInfo {
  openId: string;
  nickName: string;
  gender: number;
  city: string;
  province: string;
  country: string;
  avatarUrl: string;
  unionId?: string;
}

/**
 * 通过code获取微信session
 */
export async function getWechatSession(code: string): Promise<WechatSession> {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('微信配置缺失：请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode) {
      throw new Error(`微信API错误: ${data.errmsg} (错误码: ${data.errcode})`);
    }

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid,
    };
  } catch (error) {
    console.error('获取微信session失败:', error);
    throw new Error('微信登录失败，请重试');
  }
}

/**
 * 验证微信用户信息
 */
export function validateWechatUserInfo(userData: any): WechatUserInfo | null {
  if (!userData || typeof userData !== 'object') {
    return null;
  }

  return {
    openId: userData.openId || '',
    nickName: userData.nickName || '微信用户',
    gender: userData.gender || 0,
    city: userData.city || '',
    province: userData.province || '',
    country: userData.country || '',
    avatarUrl: userData.avatarUrl || '',
    unionId: userData.unionId,
  };
}