import { NextRequest, NextResponse } from 'next/server';
import { matchupManager } from '@/storage/database/matchupManager';
import { insertMatchupSchema } from '@/storage/database/shared/schema';

// GET - 获取约球列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const skillLevel = searchParams.get('skillLevel');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const filters: any = {};
    if (skillLevel) filters.skillLevel = parseInt(skillLevel);
    if (status) filters.status = status as any;
    
    const skip = (page - 1) * limit;
    const matchups = await matchupManager.getMatchups({ filters, skip, limit });
    
    return NextResponse.json({
      success: true,
      data: matchups
    });
  } catch (error: any) {
    console.error('Get matchups error:', error);
    return NextResponse.json(
      { error: '获取约球列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建约球
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertMatchupSchema.parse(body);
    
    const matchup = await matchupManager.createMatchup(validatedData);
    
    return NextResponse.json({
      success: true,
      data: matchup,
      message: '约球创建成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create matchup error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '创建约球失败' },
      { status: 500 }
    );
  }
}
