import { NextRequest, NextResponse } from 'next/server';
import { coachManager } from '@/storage/database/coachManager';

// POST - 审核教练
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { status, reason } = body;
    
    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: '无效的审核状态' },
        { status: 400 }
      );
    }
    
    const coach = await coachManager.approve(params.id, status, reason);
    
    if (!coach) {
      return NextResponse.json(
        { error: '教练不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: coach,
      message: `教练${status === 'approved' ? '已通过' : status === 'rejected' ? '已拒绝' : '已封禁'}审核`
    });
  } catch (error: any) {
    console.error('Approve coach error:', error);
    return NextResponse.json(
      { error: '审核失败' },
      { status: 500 }
    );
  }
}
