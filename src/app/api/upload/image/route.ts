import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

// POST - 上传图片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'images';

    // 验证文件
    if (!file) {
      return NextResponse.json(
        { error: '请上传图片文件' },
        { status: 400 }
      );
    }

    // 验证图片格式
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '仅支持JPG、PNG、GIF、WebP格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB限制）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片大小不能超过5MB' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到对象存储
    const { key, url } = await uploadFile(buffer, file.name, { contentType: file.type, folder });

    return NextResponse.json({
      success: true,
      data: {
        key,
        url,
      },
      message: '图片上传成功'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload image error:', error);
    return NextResponse.json(
      { error: '图片上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}
