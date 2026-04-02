import { NextRequest, NextResponse } from 'next/server';

// POST - 赛事报名
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: '赛事功能暂时未开放' },
    { status: 403 }
  );
}

// GET - 获取报名信息
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: '赛事功能暂时未开放' },
    { status: 403 }
  );
}

// DELETE - 取消报名
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { error: '赛事功能暂时未开放' },
    { status: 403 }
  );
}
