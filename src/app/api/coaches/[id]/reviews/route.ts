import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { coachManager } from '@/storage/database/coachManager';
import { userManager } from '@/storage/database/userManager';
import { insertCoachReviewSchema } from '@/storage/database/shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 从Cookie中获取当前用户ID
 * @returns 用户ID或null
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(JWT_SECRET)
    );

    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

// GET - 获取教练评价列表
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const reviews = await coachManager.getReviews(params.id, page, limit);
    
    // 获取用户信息
    const reviewsWithUserInfo = await Promise.all(
      reviews.map(async (review) => {
        try {
          const user = await userManager.getUserById(review.userId);
          return {
            ...review,
            userName: user?.name || '用户',
            userAvatar: user?.avatar
          };
        } catch (err) {
          return {
            ...review,
            userName: '用户',
            userAvatar: null
          };
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      data: reviewsWithUserInfo
    });
  } catch (error: any) {
    console.error('Get coach reviews error:', error);
    return NextResponse.json(
      { error: '获取评价列表失败' },
      { status: 500 }
    );
  }
}

// POST - 添加教练评价
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }
    
    const validatedData = insertCoachReviewSchema.parse({
      ...body,
      coachId: params.id,
      userId
    });
    
    const review = await coachManager.addReview(validatedData);
    
    // 获取用户信息
    const user = await userManager.getUserById(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        ...review,
        userName: user?.name || '用户',
        userAvatar: user?.avatar
      },
      message: '评价添加成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Add coach review error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '添加评价失败' },
      { status: 500 }
    );
  }
}
