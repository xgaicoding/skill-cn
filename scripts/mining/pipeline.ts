/**
 * 实践案例挖掘 Pipeline
 * 
 * 用法: npx tsx scripts/mining/pipeline.ts "https://mp.weixin.qq.com/s/xxx"
 * 
 * 流程: 获取文章 → 提取纯文本 → AI评分 → 匹配Skill → 查重 → 入库
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============ 加载环境变量 ============
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../../.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const WERSS_URL = process.env.WERSS_URL || 'http://127.0.0.1:8001';
const WERSS_USERNAME = process.env.WERSS_USERNAME || 'admin';
const WERSS_PASSWORD = process.env.WERSS_PASSWORD || 'admin@123';

// ============ HTML → 纯文本 ============
function stripHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ============ We-MP-RSS API ============
let werssToken: string | null = null;

async function werssLogin(): Promise<string> {
  if (werssToken) return werssToken;
  const res = await fetch(`${WERSS_URL}/api/v1/wx/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${WERSS_USERNAME}&password=${WERSS_PASSWORD}`,
  });
  const data = await res.json() as any;
  if (data.code !== 0) throw new Error(`we-mp-rss login failed: ${data.message}`);
  werssToken = data.data.access_token;
  return werssToken!;
}

type WechatArticle = {
  title: string;
  content: string;       // HTML
  plainText: string;     // 纯文本
  author: string;
  mpName: string;
  description: string;
  publishTime: number;
  sourceUrl: string;
};

async function fetchWechatArticle(url: string): Promise<WechatArticle> {
  const token = await werssLogin();
  const res = await fetch(
    `${WERSS_URL}/api/v1/wx/mps/by_article?url=${encodeURIComponent(url)}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  const data = await res.json() as any;
  if (data.code !== 0) throw new Error(`we-mp-rss fetch failed: ${data.message}`);
  
  const d = data.data;
  const plainText = stripHTML(d.content || '');
  
  return {
    title: d.title || '',
    content: d.content || '',
    plainText,
    author: d.author || d.mp_info?.mp_name || '',
    mpName: d.mp_info?.mp_name || '',
    description: d.description || '',
    publishTime: d.publish_time || 0,
    sourceUrl: url,
  };
}

// ============ Supabase 操作 ============
async function supabaseQuery(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res.json();
}

async function checkDuplicate(sourceUrl: string): Promise<boolean> {
  const data = await supabaseQuery(
    `practice_candidates?source_url=eq.${encodeURIComponent(sourceUrl)}&select=id&limit=1`
  );
  if (Array.isArray(data) && data.length > 0) return true;
  // 也检查 practices 表
  const existing = await supabaseQuery(
    `practices?source_url=eq.${encodeURIComponent(sourceUrl)}&select=id&limit=1`
  );
  return Array.isArray(existing) && existing.length > 0;
}

type SkillInfo = { id: number; name: string; name_en: string | null };

async function fetchAllSkills(): Promise<SkillInfo[]> {
  return supabaseQuery('skills?select=id,name,name_en') as Promise<SkillInfo[]>;
}

async function insertCandidate(candidate: Record<string, any>): Promise<any> {
  const data = await supabaseQuery('practice_candidates', {
    method: 'POST',
    body: JSON.stringify(candidate),
  });
  return data;
}

// ============ AI 评分 (DeepSeek) ============
const SCORE_PROMPT = `你是 skill-cn 的实践案例筛选专家。

## 评判标准
核心公式：Skill × 场景 = 实践
关键问题：这篇文章是在"用 Skill 做事"还是在"介绍 Skill"？前者收，后者不收。

好文章范例：
- 「用AI编程 + Remotion Skill，实现直播间刷礼物特效」
- 「浏览器自动化Skill：Agent Browser究极攻略（含登录态解决方案）」
- 「小白如何使用AI编程，快速打造商用级UI」

差文章反例：
- 单纯介绍/推荐 Skill，无具体落地场景
- 工具对比评测，但没有实际项目产出

## 评分维度（每项 1-5 分）
1. 场景明确性（权重最高）— 是否解决一个具体可描述的问题
2. 实操性 — 有无操作步骤、代码、截图、踩坑记录
3. 产出可见 — 最终做出了什么，有无成果展示
4. Skill关联度 — 使用的工具能否匹配 AI Skill 生态

## 现有 Skill 列表（用于匹配）
{skills_list}

## 待评估文章
标题：{title}
作者：{author}
来源：{mp_name}
正文（前3000字）：
{content}

请严格按以下 JSON 格式输出，不要输出其他内容：
{
  "scene_score": <1-5>,
  "practical_score": <1-5>,
  "output_score": <1-5>,
  "skill_relevance_score": <1-5>,
  "recommend": <true/false>,
  "reason": "<一句话推荐理由>",
  "matched_skill_names": ["<匹配到的Skill名称>"],
  "suggested_tags": ["<建议标签>"]
}`;

type AIScoreResult = {
  totalScore: number;
  sceneScore: number;
  practicalScore: number;
  outputScore: number;
  skillRelevanceScore: number;
  recommend: boolean;
  reason: string;
  matchedSkillIds: number[];
  suggestedTags: string[];
};

async function scoreArticle(
  article: WechatArticle,
  skills: SkillInfo[]
): Promise<AIScoreResult> {
  const skillsList = skills.map(s => `- ${s.name}${s.name_en ? ` (${s.name_en})` : ''}`).join('\n');
  const truncatedContent = article.plainText.slice(0, 3000);

  const prompt = SCORE_PROMPT
    .replace('{skills_list}', skillsList)
    .replace('{title}', article.title)
    .replace('{author}', article.author)
    .replace('{mp_name}', article.mpName)
    .replace('{content}', truncatedContent);

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是专业的AI实践案例筛选助手，只输出JSON格式的评分结果。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${errText}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`AI 返回格式错误: ${text.slice(0, 200)}`);

  const result = JSON.parse(jsonMatch[0]);

  // 加权计算总分 (1-10)
  const totalScore = (
    (result.scene_score || 0) * 0.35 +
    (result.practical_score || 0) * 0.30 +
    (result.output_score || 0) * 0.20 +
    (result.skill_relevance_score || 0) * 0.15
  ) * 2;

  // 匹配 Skill ID
  const matchedNames: string[] = result.matched_skill_names || [];
  const matchedSkillIds = matchedNames
    .map(name => {
      const lower = name.toLowerCase();
      return skills.find(s =>
        s.name.toLowerCase().includes(lower) ||
        lower.includes(s.name.toLowerCase()) ||
        (s.name_en && (s.name_en.toLowerCase().includes(lower) || lower.includes(s.name_en.toLowerCase())))
      );
    })
    .filter(Boolean)
    .map(s => s!.id);

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    sceneScore: result.scene_score || 0,
    practicalScore: result.practical_score || 0,
    outputScore: result.output_score || 0,
    skillRelevanceScore: result.skill_relevance_score || 0,
    recommend: result.recommend ?? totalScore >= 7,
    reason: result.reason || '',
    matchedSkillIds: [...new Set(matchedSkillIds)],
    suggestedTags: result.suggested_tags || [],
  };
}

// ============ 主 Pipeline ============
async function processArticle(url: string): Promise<{
  success: boolean;
  candidate?: any;
  score?: AIScoreResult;
  error?: string;
}> {
  console.log(`\n📥 获取文章: ${url}`);

  // 1. 查重
  const isDup = await checkDuplicate(url);
  if (isDup) {
    return { success: false, error: '文章已存在（候选池或已收录）' };
  }
  console.log('✅ 查重通过');

  // 2. 获取文章
  const article = await fetchWechatArticle(url);
  console.log(`📄 标题: ${article.title}`);
  console.log(`👤 作者: ${article.author} | 公众号: ${article.mpName}`);
  console.log(`📝 正文长度: ${article.plainText.length} 字`);

  // 3. AI 评分
  console.log('\n🤖 AI 评分中...');
  const skills = await fetchAllSkills();
  const score = await scoreArticle(article, skills);
  
  console.log(`\n📊 评分结果:`);
  console.log(`   总分: ${score.totalScore}/10`);
  console.log(`   场景明确性: ${score.sceneScore}/5`);
  console.log(`   实操性: ${score.practicalScore}/5`);
  console.log(`   产出可见: ${score.outputScore}/5`);
  console.log(`   Skill关联: ${score.skillRelevanceScore}/5`);
  console.log(`   推荐收录: ${score.recommend ? '✅ 是' : '❌ 否'}`);
  console.log(`   理由: ${score.reason}`);
  if (score.matchedSkillIds.length > 0) {
    const matched = skills.filter(s => score.matchedSkillIds.includes(s.id));
    console.log(`   匹配Skill: ${matched.map(s => s.name).join(', ')}`);
  }
  if (score.suggestedTags.length > 0) {
    console.log(`   建议标签: ${score.suggestedTags.join(', ')}`);
  }

  // 4. 入库候选池
  const publishedAt = article.publishTime
    ? new Date(article.publishTime * 1000).toISOString()
    : null;

  const candidate = {
    title: article.title,
    summary: article.description || article.plainText.slice(0, 200),
    content: article.plainText.slice(0, 10000), // 存前1万字
    channel: '公众号',
    source_url: url,
    author_name: article.author,
    published_at: publishedAt,
    ai_score: score.totalScore,
    ai_relevance_score: score.sceneScore,
    ai_practical_score: score.practicalScore,
    ai_quality_score: score.outputScore,
    ai_reason: score.reason,
    ai_suggested_skill_ids: score.matchedSkillIds,
    ai_suggested_tags: score.suggestedTags,
    status: 'pending',
    source_type: 'manual',
  };

  console.log('\n💾 写入候选池...');
  const inserted = await insertCandidate(candidate);
  console.log(`✅ 入库成功! ID: ${inserted?.[0]?.id || 'unknown'}`);

  return { success: true, candidate: inserted?.[0], score };
}

// ============ CLI 入口 ============
async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('用法: npx tsx scripts/mining/pipeline.ts "<公众号文章链接>"');
    process.exit(1);
  }

  // 检查环境变量
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'DEEPSEEK_API_KEY']
    .filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`缺少环境变量: ${missing.join(', ')}`);
    process.exit(1);
  }

  try {
    const result = await processArticle(url);
    if (result.success) {
      console.log('\n🎉 Pipeline 完成！文章已进入候选池，等待审核。');
    } else {
      console.log(`\n⚠️ 未入库: ${result.error}`);
    }
  } catch (err: any) {
    console.error(`\n❌ Pipeline 失败: ${err.message}`);
    process.exit(1);
  }
}

main();
