import { NextRequest, NextResponse } from 'next/server';

// GET - 获取用户的AI分析记录
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'AI分析功能暂时未开放' },
    { status: 403 }
  );
}

// POST - 创建AI分析记录
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'AI分析功能暂时未开放' },
    { status: 403 }
  );
}

// PUT - 更新AI分析记录
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'AI分析功能暂时未开放' },
    { status: 403 }
  );
}

// DELETE - 删除AI分析记录
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'AI分析功能暂时未开放' },
    { status: 403 }
  );
}
