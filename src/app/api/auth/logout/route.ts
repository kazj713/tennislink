/**
 * 退出登录API
 * 清除用户登录状态
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/logout
 * 退出登录接口
 * 清除用户的认证cookie
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    
    return NextResponse.json({
      success: true,
      message: '退出登录成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '退出登录失败' },
      { status: 500 }
    );
  }
}
