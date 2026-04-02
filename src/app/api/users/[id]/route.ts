/**
 * 获取用户信息API
 * 支持通过用户ID获取用户基本信息
 */
import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database/userManager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      );
    }

    // 获取用户信息
    const user = await userManager.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 移除敏感信息
    const { password, ...userWithoutPassword } = user;

    // 如果是教练，获取教练级别信息
    let level = '未知';
    if (user.role === 'coach') {
      try {
        const { coachManager } = await import('@/storage/database/coachManager');
        const coachData = await coachManager.findByUserId(user.id);
        level = '教练'; // 简化处理，直接设置为教练
      } catch (error) {
        console.warn('获取教练信息失败:', error);
      }
    } else if (user.role === 'student') {
      // 学生可以根据其他信息推断级别，这里简化处理
      level = '业余选手';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        level
      }
    });

  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}