import { NextRequest, NextResponse } from 'next/server';

// POST - 生成学习报告
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'AI分析功能暂时未开放' },
    { status: 403 }
  );
}

// GET - 获取学习报告
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'AI分析功能暂时未开放' },
    { status: 403 }
  );
}
