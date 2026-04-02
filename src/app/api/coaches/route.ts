/**
 * 教练管理API
 * 处理教练资料的查询和创建
 */
import { NextRequest, NextResponse } from 'next/server';
import { coachManager } from '@/storage/database/coachManager';
import { insertCoachSchema, updateCoachSchema } from '@/storage/database/shared/schema';

// 分页配置常量
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * GET /api/coaches
 * 获取教练列表（支持分页）
 * 查询参数:
 *   - page: 页码（默认1）
 *   - pageSize: 每页数量（默认20，最大100）
 *   - city: 城市（可选）
 *   - minLevel: 最低级别（可选）
 *   - maxPrice: 最高价格（可选）
 *   - status: 教练状态（默认为approved）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 分页参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE)))
    );

    // 过滤参数
    const city = searchParams.get('city');
    const minLevel = searchParams.get('minLevel');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status') || 'approved';

    const filters: any = {};
    if (city) filters.city = city;
    if (minLevel) filters.minLevel = parseInt(minLevel);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (status) filters.status = status as any;

    // 计算分页偏移量
    const skip = (page - 1) * pageSize;

    // 获取教练列表（带分页）
    const coaches = await coachManager.getCoaches({
      skip,
      limit: pageSize,
      filters: { status: 'approved' },
    });

    // 获取总数（用于分页信息）
    const total = await coachManager.getCoachesCount(filters);

    return NextResponse.json({
      success: true,
      data: coaches,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Get coaches error:', error);
    return NextResponse.json(
      { error: '获取教练列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coaches
 * 创建教练资料
 * 请求体:
 *   - userId: 用户ID
 *   - experienceYears: 经验年限
 *   - certifications: 认证信息
 *   - specialties: 专长
 *   - hourlyRate: 每小时费用
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertCoachSchema.parse(body);

    const coach = await coachManager.create(validatedData);

    return NextResponse.json({
      success: true,
      data: coach,
      message: '教练资料创建成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create coach error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '创建教练资料失败' },
      { status: 500 }
    );
  }
}
