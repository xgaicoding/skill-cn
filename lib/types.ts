export type Skill = {
  id: number;
  name: string;
  description: string;
  tag: string;
  source_url: string;
  is_listed: boolean;
  download_count: number;
  practice_count: number;
  heat_score: number;
  repo_stars: number | null;
  repo_owner_name: string | null;
  repo_owner_avatar_url: string | null;
  updated_at: string | null;
  markdown: string | null;
  markdown_render_mode: "markdown" | "plain";
};

export type Practice = {
  id: number;
  skill_id: number;
  // 首页 Hero 推荐卡片使用的关联 Skill 名称（由 API 补充注入）。
  skill_name?: string | null;
  title: string;
  summary: string;
  channel: string;
  updated_at: string;
  source_url: string;
  author_name: string | null;
  is_listed: boolean;
  is_featured: boolean;
  click_count: number;
};

export type Paginated<T> = {
  data: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};
