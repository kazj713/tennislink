/**
 * 通用文件上传API
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, validateImageFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'venue', 'certification', 'avatar', etc.
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: '没有选择文件' },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过5MB' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '只支持 JPG、PNG、GIF、WebP 格式的图片' },
        { status: 400 }
      );
    }

    // 读取文件为Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证图片文件头
    if (!validateImageFile(buffer)) {
      return NextResponse.json(
        { error: '无效的图片文件' },
        { status: 400 }
      );
    }

    // 确定上传文件夹
    let folder = 'uploads';
    switch (type) {
      case 'venue':
        folder = 'venues';
        break;
      case 'certification':
        folder = 'certifications';
        break;
      case 'avatar':
        folder = 'avatars';
        break;
      default:
        folder = 'uploads';
    }

    // 上传文件
    const result = await uploadFile(buffer, file.name, {
      folder,
      contentType: file.type,
      isPublic
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}