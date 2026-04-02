import { NextRequest, NextResponse } from 'next/server';
import { profitSharingManager } from '@/storage/database/profitSharingManager';

// GET - 获取结算记录列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');
    const status = searchParams.get('status');
    
    const settlements = await profitSharingManager.getSettlementRecords({
      filters: {
        ...(recipientId ? { recipientId } : {}),
        ...(status ? { status: status as "pending" | "completed" | "failed" | "processing" } : {}),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: settlements,
    });
  } catch (error: any) {
    console.error('获取结算记录列表失败:', error);
    return NextResponse.json(
      { error: '获取结算记录列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建结算记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, profitSharingRecordIds, paymentMethod } = body;
    
    if (!recipientId || !profitSharingRecordIds || !paymentMethod) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const settlement = await profitSharingManager.batchCreateSettlement(
      recipientId,
      profitSharingRecordIds,
      paymentMethod
    );
    
    return NextResponse.json({
      success: true,
      data: settlement,
      message: '创建结算记录成功',
    }, { status: 201 });
  } catch (error: any) {
    console.error('创建结算记录失败:', error);
    return NextResponse.json(
      { error: '创建结算记录失败' },
      { status: 500 }
    );
  }
}

// PUT - 处理手动转账
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementId, transactionId } = body;
    
    if (!settlementId || !transactionId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const settlement = await profitSharingManager.processManualTransfer(
      settlementId,
      transactionId
    );
    
    if (!settlement) {
      return NextResponse.json(
        { error: '结算记录不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: settlement,
      message: '处理转账成功',
    });
  } catch (error: any) {
    console.error('处理转账失败:', error);
    return NextResponse.json(
      { error: '处理转账失败' },
      { status: 500 }
    );
  }
}

// DELETE - 取消结算
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少结算记录ID' },
        { status: 400 }
      );
    }
    
    const success = await profitSharingManager.cancelSettlement(id);
    
    if (!success) {
      return NextResponse.json(
        { error: '结算记录不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '取消结算成功',
    });
  } catch (error: any) {
    console.error('取消结算失败:', error);
    return NextResponse.json(
      { error: '取消结算失败' },
      { status: 500 }
    );
  }
}
