-- Migration: 实践案例候选池表
-- 用于存储 AI 挖掘的待审核实践案例

create table if not exists public.practice_candidates (
  id serial primary key,
  
  -- 基础信息
  title text not null,
  summary text,
  content text,                    -- 原文内容（用于 AI 分析）
  channel text not null,           -- 来源渠道：公众号/小红书/掘金等
  source_url text not null unique, -- 原文链接（唯一，防重复）
  author_name text,
  published_at timestamp,          -- 原文发布时间
  
  -- AI 评分
  ai_score decimal(3,1),           -- AI 综合评分 1-10
  ai_relevance_score decimal(3,1), -- 相关性评分
  ai_practical_score decimal(3,1), -- 实操性评分
  ai_quality_score decimal(3,1),   -- 质量评分
  ai_reason text,                  -- AI 推荐理由
  ai_suggested_skill_ids int[],    -- AI 建议关联的 Skill ID
  ai_suggested_tags text[],        -- AI 建议的标签
  
  -- 审核状态
  status text not null default 'pending',  -- pending / approved / rejected / duplicate
  reviewed_at timestamp,
  reviewed_by text,                -- 审核人
  reject_reason text,              -- 拒绝原因
  
  -- 入库后的关联
  practice_id int references public.practices(id) on delete set null,
  
  -- 元数据
  source_type text default 'rss',  -- rss / user_submit / manual
  crawled_at timestamp default now(),
  created_at timestamp default now(),
  updated_at_sys timestamp default now()
);

-- 索引
create index if not exists idx_practice_candidates_status on public.practice_candidates(status);
create index if not exists idx_practice_candidates_ai_score on public.practice_candidates(ai_score desc) where status = 'pending';
create index if not exists idx_practice_candidates_created_at on public.practice_candidates(created_at desc);

-- 注释
comment on table public.practice_candidates is '实践案例候选池：存储 AI 挖掘的待审核内容';
comment on column public.practice_candidates.status is 'pending=待审核, approved=已收录, rejected=已拒绝, duplicate=重复';
comment on column public.practice_candidates.source_type is 'rss=RSS订阅, user_submit=用户提交, manual=手动添加';
