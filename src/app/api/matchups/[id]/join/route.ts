import { NextRequest, NextResponse } from 'next/server';
import { matchupManager } from '@/storage/database/matchupManager';

// POST - 加入约球
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
    
    const participant = await matchupManager.addParticipant({
      matchupId: params.id,
      userId: userId,
      status: 'confirmed'
    });
    
    return NextResponse.json({
      success: true,
      data: participant,
      message: '加入约球成功'
    });
  } catch (error: any) {
    console.error('Join matchup error:', error);
    
    if (error.message === '约球已满员') {
      return NextResponse.json(
        { error: '约球已满员' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '加入约球失败' },
      { status: 500 }
    );
  }
}
