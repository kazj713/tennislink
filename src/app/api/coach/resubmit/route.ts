/**
 * 教练重新提交审核API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByOpenid, updateCoachProfile } from '@/storage/database/userManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { openid, certifications, specialties, introduction, hourlyRate } = body;

    // 验证必填参数
    if (!openid) {
      return NextResponse.json(
        { error: '用户身份验证失败' },
        { status: 401 }
      );
    }

    // 验证用户存在
    const user = await getUserByOpenid(openid);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证是否为教练
    if (user.role !== 'coach') {
      return NextResponse.json(
        { error: '只有教练可以提交审核' },
        { status: 403 }
      );
    }

    // 验证证书信息
    if (!certifications || certifications.length === 0) {
      return NextResponse.json(
        { error: '请至少上传一个证书' },
        { status: 400 }
      );
    }

    // 验证专业特长
    if (!specialties || specialties.length === 0) {
      return NextResponse.json(
        { error: '请选择至少一个专业特长' },
        { status: 400 }
      );
    }

    // 更新教练资料
    const updatedProfile = {
      bio: introduction || user.bio || '',
      // 教练资料存储在 bio 字段或其他适当的位置
      // 如果需要存储复杂的教练资料，建议创建单独的教练资料表
    };

    const success = await updateCoachProfile(user.id, updatedProfile);
    
    if (!success) {
      return NextResponse.json(
        { error: '提交审核失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '重新提交审核成功'
    });

  } catch (error) {
    console.error('教练重新提交审核失败:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}