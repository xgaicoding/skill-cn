/**
 * 实践案例候选池类型定义
 */

export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'duplicate';
export type SourceType = 'rss' | 'user_submit' | 'manual';

/**
 * 实践案例候选（待审核）
 */
export type PracticeCandidate = {
  id: number;
  
  // 基础信息
  title: string;
  summary: string | null;
  content: string | null;
  channel: string;
  source_url: string;
  author_name: string | null;
  published_at: string | null;
  
  // AI 评分
  ai_score: number | null;
  ai_relevance_score: number | null;
  ai_practical_score: number | null;
  ai_quality_score: number | null;
  ai_reason: string | null;
  ai_suggested_skill_ids: number[] | null;
  ai_suggested_tags: string[] | null;
  
  // 审核状态
  status: CandidateStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reject_reason: string | null;
  
  // 入库关联
  practice_id: number | null;
  
  // 元数据
  source_type: SourceType;
  crawled_at: string;
  created_at: string;
};

/**
 * AI 评分结果
 */
export type AIScoreResult = {
  score: number;              // 综合评分 1-10
  relevance_score: number;    // 相关性 1-5
  practical_score: number;    // 实操性 1-5
  quality_score: number;      // 质量 1-5
  recommend: boolean;         // 是否推荐收录
  reason: string;             // 推荐理由
  suggested_skill_ids: number[];
  suggested_tags: string[];
};

/**
 * RSS 订阅源配置
 */
export type RSSSource = {
  id: string;
  name: string;               // 公众号/博客名称
  feed_url: string;           // RSS 订阅地址
  channel: string;            // 渠道类型
  enabled: boolean;
  priority: number;           // 优先级 1-10
  last_fetched_at: string | null;
};
