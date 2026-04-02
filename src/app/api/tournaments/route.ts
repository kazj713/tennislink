import { NextRequest, NextResponse } from 'next/server';

// GET - 获取赛事列表
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: '赛事功能暂时未开放' },
    { status: 403 }
  );
}

// POST - 创建赛事（仅管理员）
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: '赛事功能暂时未开放' },
    { status: 403 }
  );
}

// PUT - 更新赛事
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: '赛事功能暂时未开放' },
    { status: 403 }
  );
}

// DELETE - 删除赛事
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: '赛事功能暂时未开放' },
    { status: 403 }
  );
}
