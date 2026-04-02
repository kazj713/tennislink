import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { analyzeVideoAction } from '@/lib/ai';

// POST - 上传视频并分析
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const coachId = formData.get('coachId') as string | null;
    const analysisType = formData.get('analysisType') as string || 'general';

    // 验证文件
    if (!file) {
      return NextResponse.json(
        { error: '请上传视频文件' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: '请提供用户ID' },
        { status: 400 }
      );
    }

    // 验证视频格式
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '仅支持MP4、WebM、MOV、AVI格式的视频' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到对象存储
    const uploadResult = await uploadFile(
      buffer,
      file.name,
      {
        folder: 'videos/tennis',
        contentType: file.type,
        isPublic: true
      }
    );

    if (!uploadResult.success || !uploadResult.url || !uploadResult.key) {
      return NextResponse.json(
        { error: '视频上传失败' },
        { status: 500 }
      );
    }

    const videoKey = uploadResult.key;
    const videoUrl = uploadResult.url;

    // AI分析视频
    const analysis = await analyzeVideoAction(videoUrl, analysisType);

    // 保存分析记录到数据库
    const { aiAnalysisManager } = await import('@/storage/database/aiAnalysisManager');
    const record = await aiAnalysisManager.create({
      userId,
      coachId: coachId || null,
      videoUrl: videoKey,
      videoThumbnail: null, // 可以后续生成缩略图
      analysisType,
      analysisResult: analysis,
      improvementSuggestions: analysis.content,
      score: analysis.score,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        videoUrl,
        analysis: analysis,
        createdAt: record.createdAt,
      },
      message: '视频上传和分析完成'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Upload video error:', error);
    return NextResponse.json(
      { error: '视频上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}
