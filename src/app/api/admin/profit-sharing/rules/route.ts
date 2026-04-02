import { NextRequest, NextResponse } from 'next/server';
import { profitSharingManager } from '@/storage/database/profitSharingManager';

// GET - 获取分账规则列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive') === 'true';
    
    const rules = await profitSharingManager.getProfitSharingRules({
      filters: {
        ...(type ? { type: type as "other" | "tournament" | "course" | "venue" } : {}),
        ...(searchParams.has('isActive') ? { isActive } : {}),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error: any) {
    console.error('获取分账规则列表失败:', error);
    return NextResponse.json(
      { error: '获取分账规则列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建分账规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rule = await profitSharingManager.createProfitSharingRule(body);
    
    return NextResponse.json({
      success: true,
      data: rule,
      message: '创建分账规则成功',
    }, { status: 201 });
  } catch (error: any) {
    console.error('创建分账规则失败:', error);
    return NextResponse.json(
      { error: '创建分账规则失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新分账规则
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少分账规则ID' },
        { status: 400 }
      );
    }
    
    const rule = await profitSharingManager.updateProfitSharingRule(id, data);
    
    if (!rule) {
      return NextResponse.json(
        { error: '分账规则不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: rule,
      message: '更新分账规则成功',
    });
  } catch (error: any) {
    console.error('更新分账规则失败:', error);
    return NextResponse.json(
      { error: '更新分账规则失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除分账规则
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少分账规则ID' },
        { status: 400 }
      );
    }
    
    const success = await profitSharingManager.deleteProfitSharingRule(id);
    
    if (!success) {
      return NextResponse.json(
        { error: '分账规则不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '删除分账规则成功',
    });
  } catch (error: any) {
    console.error('删除分账规则失败:', error);
    return NextResponse.json(
      { error: '删除分账规则失败' },
      { status: 500 }
    );
  }
}
