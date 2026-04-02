import { NextRequest, NextResponse } from 'next/server';
import { coachManager } from '@/storage/database/coachManager';
import { updateCoachSchema } from '@/storage/database/shared/schema';

// GET - 获取教练详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const coach = await coachManager.findByIdWithDetails(params.id);
    
    if (!coach) {
      return NextResponse.json(
        { error: '教练不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: coach
    });
  } catch (error: any) {
    console.error('Get coach error:', error);
    return NextResponse.json(
      { error: '获取教练详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新教练资料
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const validatedData = updateCoachSchema.parse(body);
    
    const coach = await coachManager.update(params.id, validatedData);
    
    if (!coach) {
      return NextResponse.json(
        { error: '教练不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: coach,
      message: '教练资料更新成功'
    });
  } catch (error: any) {
    console.error('Update coach error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '更新教练资料失败' },
      { status: 500 }
    );
  }
}
