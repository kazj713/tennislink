import { NextResponse } from 'next/server';
import { db } from '@/storage/database/instance';
import { coaches, users } from '@/storage/database/shared/schema';
import { recommendCoaches, filterCoachesByBasicConditions } from '@/lib/coach-recommendation';

export async function POST(request: Request) {
  try {
    const preference = await request.json();
    
    // 验证请求参数
    if (!preference || !preference.budget || !preference.preferredTime || !preference.learningGoal) {
      return NextResponse.json(
        { error: '缺少必要的请求参数' },
        { status: 400 }
      );
    }
    
    // 从数据库获取所有教练
    const allCoaches = await db.select().from(coaches);
    
    // 过滤符合基本条件的教练
    const filteredCoaches = filterCoachesByBasicConditions(allCoaches, preference);
    
    // 计算推荐结果
    const recommendations = recommendCoaches(filteredCoaches, preference);
    
    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length
    });
  } catch (error) {
    console.error('教练推荐失败:', error);
    return NextResponse.json(
      { error: '教练推荐失败，请稍后重试' },
      { status: 500 }
    );
  }
}
