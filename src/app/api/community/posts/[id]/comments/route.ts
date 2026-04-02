import { NextRequest, NextResponse } from 'next/server';
import { communityManager } from '@/storage/database/communityManager';
import { insertCommunityCommentSchema } from '@/storage/database/shared/schema';

// GET - 获取帖子评论
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const comments = await communityManager.getComments(params.id);
    
    return NextResponse.json({
      success: true,
      data: comments
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: '获取评论失败' },
      { status: 500 }
    );
  }
}

// POST - 添加评论
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const validatedData = insertCommunityCommentSchema.parse({
      ...body,
      postId: params.id
    });
    
    const comment = await communityManager.createComment(validatedData);
    
    return NextResponse.json({
      success: true,
      data: comment,
      message: '评论添加成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add comment error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '添加评论失败' },
      { status: 500 }
    );
  }
}
