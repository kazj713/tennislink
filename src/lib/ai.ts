// AI分析功能已禁用
let llmClient: any = null;

// 直接禁用AI功能
console.warn('AI features are disabled');
llmClient = null;

/**
 * AI视频动作分析
 * @param videoUrl 视频URL（可以是对象存储的签名URL或公网URL）
 * @param analysisType 分析类型（如：正手、反手、发球、截击等）
 * @returns 分析结果
 */
export async function analyzeVideoAction(
  videoUrl: string,
  analysisType: string = 'general'
) {
  // 检查llmClient是否可用
  if (!llmClient) {
    return {
      content: 'AI分析功能暂时不可用，请联系管理员',
      score: 0,
      analysisType,
    };
  }

  const systemPrompt = `你是一位专业的网球教练和技术分析师。请分析提供的网球动作视频，并提供详细的反馈。

你的分析应该包括：
1. **动作评估**：评估该动作的技术要点和执行质量
2. **优点识别**：指出动作中做得好的地方
3. **问题识别**：识别出技术问题和需要改进的地方
4. **改进建议**：提供具体的、可操作的改进建议
5. **评分**：给该动作打分（0-100分）

请用中文回复，格式清晰，重点突出。`;

  const userPrompt = `请分析这段${analysisType}视频，提供专业的技术分析和改进建议。`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: `${userPrompt}\n\n视频URL: ${videoUrl}` },
  ];

  try {
    // 使用流式输出
    const stream = llmClient.stream(messages, {
      model: 'doubao-seed-1-6-vision-250815',
      temperature: 0.7,
    });

    let fullContent = '';
    const chunks: string[] = [];

    for await (const chunk of stream) {
      if (chunk.content) {
        const text = chunk.content.toString();
        fullContent += text;
        chunks.push(text);
      }
    }

    // 解析评分（从内容中提取）
    const scoreMatch = fullContent.match(/(\d+)分/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

    return {
      content: fullContent,
      score,
      analysisType,
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      content: 'AI分析失败，请稍后重试',
      score: 0,
      analysisType,
    };
  }
}

/**
 * 生成学习报告
 * @param analyses 历史分析结果数组
 * @param period 报告周期（周报/月报）
 * @returns 学习报告
 */
export async function generateLearningReport(
  analyses: Array<{
    content: string;
    score?: number;
    analysisType: string;
    createdAt?: Date;
  }>,
  period: 'weekly' | 'monthly' = 'weekly'
) {
  // 检查llmClient是否可用
  if (!llmClient) {
    return {
      content: 'AI学习报告功能暂时不可用，请联系管理员',
      period,
    };
  }

  const periodText = period === 'weekly' ? '周' : '月';

  // 汇总分析内容
  const analysisSummary = analyses
    .map((a, i) => `分析${i + 1}（${a.analysisType}）- 评分：${a.score || '未评分'}分\n${a.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `你是一位专业的网球教练和学习顾问。请根据学员的历史动作分析结果，生成一份${periodText}学习报告。

报告应该包括：
1. **进步总结**：总结学员在这一${periodText}的整体进步
2. **技术提升**：列出技术上的具体提升点
3. **持续问题**：识别反复出现的问题
4. **常见错误**：统计最常见的错误类型
5. **学习建议**：基于分析结果，给出下一${periodText}的学习重点和建议
6. **教练寄语**：鼓励学员继续努力

请用中文回复，语言专业但亲切，格式清晰。`;

  const userPrompt = `以下是学员的${periodText}动作分析记录，请生成学习报告：\n\n${analysisSummary}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  try {
    const response = await llmClient.invoke(messages, {
      model: 'doubao-seed-1-6-251015',
      temperature: 0.8,
    });

    return {
      content: response.content,
      period,
    };
  } catch (error) {
    console.error('Generate report error:', error);
    return {
      content: '生成学习报告失败，请稍后重试',
      period,
    };
  }
}
