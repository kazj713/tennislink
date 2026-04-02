import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { userManager } from '@/storage/database/userManager';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 本地开发环境的模拟用户数据
const MOCK_USERS = [
  {
    id: 'admin-001',
    email: 'admin@tennislink.com',
    name: '系统管理员',
    role: 'admin',
    phone: '13800000000',
    avatar: null,
    username: 'admin',
    wechatOpenid: null
  },
  {
    id: 'coach-001',
    email: 'coach@tennislink.com',
    name: '测试教练',
    role: 'coach',
    phone: '13800000001',
    avatar: null,
    username: 'coach',
    wechatOpenid: null
  },
  {
    id: 'student-001',
    email: 'student@tennislink.com',
    name: '测试学员',
    role: 'student',
    phone: '13800000002',
    avatar: null,
    username: 'student',
    wechatOpenid: null
  }
];

// 检查是否是本地开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    // 验证token
    const decoded = verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    
    let user;
    
    // 本地开发环境使用模拟数据
    if (isDevelopment) {
      user = MOCK_USERS.find(u => u.id === decoded.userId);
    } else {
      // 生产环境使用数据库
      user = await userManager.findById(decoded.userId);
    }
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 如果是教练，获取教练信息（仅生产环境）
    let coachData = null;
    if (!isDevelopment && user.role === 'coach') {
      const { coachManager } = await import('@/storage/database/coachManager');
      coachData = await coachManager.findByUserId(user.id);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...user,
        coachData
      }
    });
    
  } catch (error: any) {
    console.error('Get user error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: '无效的token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}
