import { NextRequest, NextResponse } from 'next/server';
import { courseManager } from '@/storage/database/courseManager';
import { insertCourseSchema } from '@/storage/database/shared/schema';

// 分页配置常量
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// GET - 获取课程列表（支持分页）
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
    const coachId = searchParams.get('coachId');
    const type = searchParams.get('type');
    const level = searchParams.get('level');
    const city = searchParams.get('city');
    const searchKeyword = searchParams.get('keyword');

    const filters: any = {};
    if (coachId) filters.coachId = coachId;
    if (type) filters.type = type as any;
    if (level) filters.level = parseInt(level);
    if (searchKeyword) filters.searchKeyword = searchKeyword;

    // 计算分页偏移量
    const skip = (page - 1) * pageSize;

    // 获取课程列表（带分页）
    const courses = await courseManager.getCourses({
      skip,
      limit: pageSize,
      filters,
    });

    // 获取总数（用于分页信息）
    const total = await courseManager.getCoursesCount(filters);

    return NextResponse.json({
      success: true,
      data: courses,
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
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: '获取课程列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建课程
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertCourseSchema.parse(body);

    const course = await courseManager.createCourse(validatedData);

    return NextResponse.json({
      success: true,
      data: course,
      message: '课程创建成功'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create course error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: '数据格式错误', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '创建课程失败' },
      { status: 500 }
    );
  }
}
