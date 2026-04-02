/**
 * 场地管理API
 * 处理网球场地的查询和创建
 */
import { NextRequest, NextResponse } from 'next/server';
import { venueManager } from '@/storage/database/venueManager';
import { insertVenueSchema } from '@/storage/database/shared/schema';

/**
 * GET /api/venues
 * 获取场地列表
 * 查询参数:
 *   - city: 城市（可选）
 *   - type: 场地类型（可选）
 *   - available: 是否可用（可选）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const available = searchParams.get('available');

    const filters: any = {};
    if (city) filters.city = city;
    if (type) filters.type = type as any;
    if (available === 'true') filters.available = true;

    const venues = await venueManager.getVenues({ filters });

    return NextResponse.json({
      success: true,
      data: venues
    });
  } catch (error: any) {
    console.error('Get venues error:', error);
    return NextResponse.json(
      { error: '获取场地列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/venues
 * 创建场地
 * 请求体:
 *   - name: 场地名称
 *   - city: 城市
 *   - address: 地址
 *   - type: 场地类型（outdoor/indoor）
 *   - hourlyRate: 每小时费用
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertVenueSchema.parse(body);

    const venue = await venueManager.createVenue(validatedData);

    return NextResponse.json({
      success: true,
      data: venue,
      message: '场地创建成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create venue error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '创建场地失败' },
      { status: 500 }
    );
  }
}
