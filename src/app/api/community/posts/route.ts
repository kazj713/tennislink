import { NextRequest, NextResponse } from 'next/server';
import { communityManager } from '@/storage/database/communityManager';
import { insertCommunityPostSchema } from '@/storage/database/shared/schema';

// GET - 获取社区帖子列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const filters: any = {};
    if (userId) filters.userId = userId;
    if (type) filters.type = type as any;
    
    const skip = (page - 1) * limit;
    const posts = await communityManager.getPosts({ filters, skip, limit });
    
    return NextResponse.json({
      success: true,
      data: posts
    });
  } catch (error: any) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: '获取帖子列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建帖子
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertCommunityPostSchema.parse(body);
    
    const post = await communityManager.createPost(validatedData);
    
    return NextResponse.json({
      success: true,
      data: post,
      message: '帖子创建成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create post error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '创建帖子失败' },
      { status: 500 }
    );
  }
}
