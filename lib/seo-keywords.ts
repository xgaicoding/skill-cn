/**
 * SEO 关键词映射表
 *
 * 核心理念（来自哥飞 SEO 知识库）：
 * - "做需求词不做品牌词" — 用户搜的是需求（"AI 做 PPT"），不是产品名（"pptx"）
 * - "茴字的四种写法" — 同一需求有多种搜索表达，覆盖最主流的说法
 * - title 中包含用户会搜索的关键词，是获取搜索流量的基础
 *
 * 用法：
 * - Skill 详情页 title: seoTitle ?? `${skill.name} 实战教程与可复用方案`
 * - Skill 详情页 H1: 可选，保持 skill.name 作为品牌名，但在副标题中包含需求词
 * - keywords meta: 自动包含 demandKeyword
 */

export interface SkillSeoData {
  /** 用户搜索的需求关键词 */
  demandKeyword: string;
  /** SEO 优化后的页面标题（不含站点名后缀） */
  seoTitle: string;
  /** 可选：H1 副标题 */
  seoSubtitle?: string;
}

/**
 * Skill ID → SEO 数据映射
 * 维护原则：
 * 1. demandKeyword = 用户最可能搜索的词
 * 2. seoTitle = 包含需求词 + skill 名 + 价值点
 * 3. 定期用 GSC 数据验证和迭代
 */
export const SKILL_SEO_MAP: Record<number, SkillSeoData> = {
  1: { demandKeyword: "AI UI 设计", seoTitle: "AI UI 设计 Skill - 让 AI 写出专业级前端界面" },
  8: { demandKeyword: "创建 Agent Skill", seoTitle: "Agent Skill 创建教程 - 从零开始打造你的 AI 技能" },
  9: { demandKeyword: "AI 做 PPT", seoTitle: "AI 做 PPT 神器 - 一键创建专业演示文稿" },
  10: { demandKeyword: "AI 前端开发", seoTitle: "AI 前端设计 Skill - 自动生成高品质 UI 界面" },
  11: { demandKeyword: "Supabase 数据库优化", seoTitle: "Supabase Postgres 最佳实践 - 数据库性能优化指南" },
  12: { demandKeyword: "AI 浏览器自动化", seoTitle: "AI 浏览器自动化 - 网页测试与数据采集" },
  13: { demandKeyword: "AI 销售线索", seoTitle: "AI 销售线索挖掘 - 自动化客户研究与联系策略" },
  14: { demandKeyword: "域名生成器", seoTitle: "AI 域名生成器 - 创意域名 + 可用性检查" },
  15: { demandKeyword: "AI 头脑风暴", seoTitle: "AI 头脑风暴 Skill - 开发前先想清楚再动手" },
  16: { demandKeyword: "React 做视频", seoTitle: "Remotion 教程 - 用 React 编程式创作视频" },
  17: { demandKeyword: "NotebookLM API", seoTitle: "Google NotebookLM 完整 API - 程序化操作笔记本" },
  18: { demandKeyword: "Markdown 转公众号", seoTitle: "Markdown 转公众号排版 - AI 全流程自动化发布" },
  19: { demandKeyword: "AI 画流程图", seoTitle: "AI 画流程图 - Excalidraw 图表自动生成" },
  20: { demandKeyword: "Three.js 3D 开发", seoTitle: "Three.js 3D 开发 Skill - AI 辅助创建 3D 交互体验" },
  21: { demandKeyword: "AI 提示词生成", seoTitle: "AI 提示词大师 - 电影级画面提示词生成器" },
  22: { demandKeyword: "Obsidian 知识管理", seoTitle: "Obsidian 知识管理 Skill - AI 打造个人知识库" },
  23: { demandKeyword: "AI 自动写公众号", seoTitle: "AI 自动写公众号 - 从素材到发布全流程自动化" },
  24: { demandKeyword: "视频下载工具", seoTitle: "视频下载 Skill - YouTube/B站/Twitter 一键下载" },
  25: { demandKeyword: "AI 写推特", seoTitle: "AI 写推特 - X/Twitter 自动化内容创作" },
  26: { demandKeyword: "AI 视频包装", seoTitle: "AI 视频包装 - 播客访谈综艺风格特效一键生成" },
  27: { demandKeyword: "AI 生成 PPT", seoTitle: "AI 生成 PPT - 智能分析文档自动创建演示文稿" },
  28: { demandKeyword: "开发效率工具", seoTitle: "开发效率 Skill 集合 - 软件开发与产品管理提效" },
  29: { demandKeyword: "Markdown 转 PPT", seoTitle: "Markdown 转 PPT - SVG 幻灯片快速生成" },
  30: { demandKeyword: "Skill 趋势追踪", seoTitle: "Agent Skill 趋势日报 - 每日热门技能排行" },
  31: { demandKeyword: "AI 学习记忆", seoTitle: "AI 编程助手学习记忆 - 不再重复踩坑" },
  32: { demandKeyword: "AI 文本去痕迹", seoTitle: "AI 文本人性化 - 去除 AI 写作痕迹" },
  33: { demandKeyword: "Milvus 向量数据库", seoTitle: "Milvus 向量数据库 Skill - 快速创建 Collection" },
  34: { demandKeyword: "Vue 最佳实践", seoTitle: "Vue 最佳实践指南 - 组件设计与性能优化" },
  35: { demandKeyword: "React 最佳实践", seoTitle: "React 最佳实践指南 - 组件设计与性能优化" },
  36: { demandKeyword: "查找 Agent Skill", seoTitle: "查找 Agent Skill - 智能发现和安装 AI 技能" },
  37: { demandKeyword: "Web UI 审查", seoTitle: "Web UI 审查 Skill - 自动检查设计规范与可访问性" },
  38: { demandKeyword: "AI 处理 PDF", seoTitle: "AI 处理 PDF - 提取文本、合并拆分、表单操作" },
  39: { demandKeyword: "AI 处理 Excel", seoTitle: "AI 处理 Excel - 公式、图表、数据分析一站式" },
  40: { demandKeyword: "SaaS 营销策略", seoTitle: "SaaS 营销策略 Skill - AI 生成增长创意" },
  41: { demandKeyword: "创建 MCP Server", seoTitle: "MCP Server 创建 Skill - 快速构建 AI 工具集成" },
  42: { demandKeyword: "YouTube 订阅更新", seoTitle: "YouTube 订阅更新 - 自动获取博主最新视频" },
  43: { demandKeyword: "YouTube 字幕提取", seoTitle: "YouTube 字幕提取转中文 - 视频文字稿生成" },
  44: { demandKeyword: "本地知识库 RAG", seoTitle: "本地知识库 RAG Skill - 文档检索与智能问答" },
  45: { demandKeyword: "AI 营销工具", seoTitle: "AI 营销技能集合 - SEO、文案、转化率优化" },
  46: { demandKeyword: "AI Agent 记忆", seoTitle: "AI Agent 持久记忆 - 跨对话知识存储" },
  47: { demandKeyword: "AI 编程工作流", seoTitle: "AI 编程全流程 Skill - 完整软件开发工作流" },
  48: { demandKeyword: "WordPress AI 开发", seoTitle: "WordPress AI 开发 Skill - 教 AI 正确构建 WordPress" },
  49: { demandKeyword: "聊天记录分析", seoTitle: "聊天记录分析 - AI 生成个性化用户画像" },
  50: { demandKeyword: "A股技术分析", seoTitle: "A 股技术分析 Skill - 多维度共振验证信号" },
  51: { demandKeyword: "AI 操控浏览器", seoTitle: "AI 操控浏览器 - 网页自动化测试与数据提取" },
  52: { demandKeyword: "AI 文字转语音", seoTitle: "AI 文字转语音 Skill - MiniMax TTS 语音合成" },
  53: { demandKeyword: "SEO 审查工具", seoTitle: "SEO 审查 Skill - 网站 SEO 诊断与优化建议" },
  54: { demandKeyword: "GitHub Pages 预览", seoTitle: "GitHub Pages 预览同步 - 自动部署文件预览" },
  56: { demandKeyword: "AI 社交通信", seoTitle: "AI 社交通信 Skill - 注册聊天与任务委派" },
};

/**
 * 获取 Skill 的 SEO 数据
 * 不在映射表中的 skill 返回 undefined，调用方使用默认值
 */
export function getSkillSeo(skillId: number): SkillSeoData | undefined {
  return SKILL_SEO_MAP[skillId];
}
