/**
 * 教练证书上传API
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, validateImageFile } from '@/lib/storage';
import { getUserByOpenid } from '@/storage/database/userManager';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份（从session或token中获取openid）
    const openid = request.headers.get('x-user-openid');
    if (!openid) {
      return NextResponse.json(
        { error: '用户身份验证失败' },
        { status: 401 }
      );
    }

    const user = await getUserByOpenid(openid);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const certificationType = formData.get('type') as string; // 'professional', 'safety', 'coach', etc.

    if (!file) {
      return NextResponse.json(
        { error: '没有选择文件' },
        { status: 400 }
      );
    }

    // 验证证书类型
    const allowedTypes = ['professional', 'safety', 'coach', 'experience'];
    if (!allowedTypes.includes(certificationType)) {
      return NextResponse.json(
        { error: '无效的证书类型' },
        { status: 400 }
      );
    }

    // 验证文件大小（证书可以稍大，10MB限制）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '证书文件大小不能超过10MB' },
        { status: 400 }
      );
    }

    // 验证文件类型（支持图片和PDF）
    const allowedFileTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ];
    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '只支持图片（JPG、PNG、GIF、WebP）和PDF格式的文件' },
        { status: 400 }
      );
    }

    // 读取文件为Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 如果是图片，验证文件头
    if (file.type.startsWith('image/') && !validateImageFile(buffer)) {
      return NextResponse.json(
        { error: '无效的图片文件' },
        { status: 400 }
      );
    }

    // 上传文件到专门的证书文件夹
    const result = await uploadFile(buffer, file.name, {
      folder: `certifications/${user.id}/${certificationType}`,
      contentType: file.type,
      isPublic: false // 证书文件默认为私有，需要权限才能访问
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // 在数据库中记录证书信息
    const { saveCertificationRecord } = await import('@/lib/certificationManager');
    await saveCertificationRecord({
      userId: user.id,
      type: certificationType as any,
      fileKey: result.key!,
      fileName: file.name,
      uploadTime: new Date(),
      status: 'pending_review'
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      type: certificationType,
      fileName: file.name
    });

  } catch (error) {
    console.error('证书上传失败:', error);
    return NextResponse.json(
      { error: '证书上传失败' },
      { status: 500 }
    );
  }
}