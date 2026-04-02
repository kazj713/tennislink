import { NextRequest, NextResponse } from 'next/server';
import { systemSettingsManager } from '@/storage/database/systemSettingsManager';
import { verifyJWTToken } from '@/lib/auth';

// 获取系统设置
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证令牌', message: '请先登录' },
        { status: 401 }
      );
    }

    const payload = await verifyJWTToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足', message: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 获取所有系统设置
    const settings = await systemSettingsManager.getAllSettings();

    return NextResponse.json({
      success: true,
      data: settings,
      message: '获取系统设置成功'
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || '获取系统设置失败',
        message: '获取系统设置失败'
      },
      { status: 500 }
    );
  }
}

// 更新系统设置
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证令牌', message: '请先登录' },
        { status: 401 }
      );
    }

    const payload = await verifyJWTToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足', message: '需要管理员权限' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 验证请求数据
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: '无效的请求数据', message: '无效的请求数据' },
        { status: 400 }
      );
    }

    // 将嵌套对象转换为扁平化的设置数组
    const settingsToUpdate: Array<{
      category: string;
      key: string;
      value: unknown;
      description?: string;
    }> = [];

    for (const [category, categorySettings] of Object.entries(body)) {
      if (typeof categorySettings === 'object' && categorySettings !== null) {
        for (const [key, value] of Object.entries(categorySettings as Record<string, unknown>)) {
          settingsToUpdate.push({
            category,
            key,
            value,
          });
        }
      }
    }

    // 批量更新设置
    const success = await systemSettingsManager.setSettings(
      settingsToUpdate,
      payload.userId
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: '更新失败', message: '更新系统设置失败' },
        { status: 500 }
      );
    }

    // 获取更新后的设置
    const updatedSettings = await systemSettingsManager.getAllSettings();

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: '更新系统设置成功'
    });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || '更新系统设置失败',
        message: '更新系统设置失败'
      },
      { status: 500 }
    );
  }
}

// 重置系统设置
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未提供认证令牌', message: '请先登录' },
        { status: 401 }
      );
    }

    const payload = await verifyJWTToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足', message: '需要管理员权限' },
        { status: 403 }
      );
    }

    // 初始化默认设置
    const success = await systemSettingsManager.initializeDefaultSettings(payload.userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: '重置失败', message: '重置系统设置失败' },
        { status: 500 }
      );
    }

    // 获取重置后的设置
    const settings = await systemSettingsManager.getAllSettings();

    return NextResponse.json({
      success: true,
      data: settings,
      message: '重置系统设置成功'
    });
  } catch (error) {
    console.error('重置系统设置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || '重置系统设置失败',
        message: '重置系统设置失败'
      },
      { status: 500 }
    );
  }
}
