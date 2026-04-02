import { NextRequest, NextResponse } from 'next/server';
import { matchupManager } from '@/storage/database/matchupManager';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const matchupId = params.id;
    
    // 获取约球信息
    const matchup = await matchupManager.getMatchupById(matchupId);
    if (!matchup) {
      return NextResponse.json(
        { error: '约球不存在' },
        { status: 404 }
      );
    }
    
    // 获取约球参与者
    const participants = await matchupManager.getParticipants(matchupId);
    
    return NextResponse.json({
      success: true,
      data: {
        ...matchup,
        participants
      },
      message: '获取约球详情成功'
    });
  } catch (error: any) {
    console.error('Get matchup details error:', error);
    return NextResponse.json(
      { error: '获取约球详情失败' },
      { status: 500 }
    );
  }
}
