import { NextRequest, NextResponse } from 'next/server';
import { communityManager } from '@/storage/database/communityManager';

// POST - 点赞/取消点赞
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: '请提供用户ID' },
        { status: 400 }
      );
    }
    
    const liked = await communityManager.toggleLike(params.id, userId);
    
    return NextResponse.json({
      success: true,
      data: { liked },
      message: liked ? '点赞成功' : '已取消点赞'
    });
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
