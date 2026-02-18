/**
 * AI 筛选评分模块
 * 
 * 使用 LLM 对候选实践案例进行评分，判断是否值得收录
 */

import type { AIScoreResult } from '@/lib/types/mining';

// AI 评分 Prompt 模板
const SCORE_PROMPT = `你是一个 AI 实践案例筛选专家。请评估以下文章是否适合收录到 skill-cn（AI Skill 实践平台）。

skill-cn 收录标准：
- 必须与 AI Skill / Agent / Prompt 工程 / AI 编程工具相关
- 必须有具体的实操步骤或代码示例，不是纯概念介绍
- 内容完整，有清晰的场景、方法、结果

评分维度（每项 1-5 分）：
1. 相关性：是否与 AI Skill/Agent/Prompt 工程相关
2. 实操性：是否有具体操作步骤或代码示例
3. 质量：内容深度、专业度、可读性

文章信息：
标题：{title}
作者：{author}
摘要：{summary}
正文（前 3000 字）：
{content}

请严格按以下 JSON 格式输出，不要输出其他内容：
{
  "relevance_score": <1-5>,
  "practical_score": <1-5>,
  "quality_score": <1-5>,
  "recommend": <true/false>,
  "reason": "<一句话推荐理由>",
  "suggested_tags": ["<建议标签1>", "<建议标签2>"]
}`;

/**
 * 调用 AI 对文章进行评分
 */
export async function scoreArticle(params: {
  title: string;
  author: string | null;
  summary: string | null;
  content: string;
  apiKey: string;
  model?: string;
}): Promise<AIScoreResult> {
  const { title, author, summary, content, apiKey, model = 'gpt-4o-mini' } = params;
  
  // 截取前 3000 字
  const truncatedContent = content.slice(0, 3000);
  
  const prompt = SCORE_PROMPT
    .replace('{title}', title)
    .replace('{author}', author || '未知')
    .replace('{summary}', summary || '无')
    .replace('{content}', truncatedContent);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是一个专业的内容筛选助手，只输出 JSON 格式的评分结果。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }
  
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  
  // 解析 JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 返回格式错误');
  }
  
  const result = JSON.parse(jsonMatch[0]);
  
  // 计算综合评分
  const score = (
    (result.relevance_score || 0) * 0.4 +
    (result.practical_score || 0) * 0.35 +
    (result.quality_score || 0) * 0.25
  ) * 2; // 转换为 1-10 分
  
  return {
    score: Math.round(score * 10) / 10,
    relevance_score: result.relevance_score || 0,
    practical_score: result.practical_score || 0,
    quality_score: result.quality_score || 0,
    recommend: result.recommend ?? score >= 7,
    reason: result.reason || '',
    suggested_skill_ids: [], // 后续根据 tags 映射
    suggested_tags: result.suggested_tags || [],
  };
}

/**
 * 判断是否应该收录
 */
export function shouldApprove(score: AIScoreResult): boolean {
  // 综合评分 >= 7 且相关性 >= 3
  return score.score >= 7 && score.relevance_score >= 3;
}
