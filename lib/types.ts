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
  // 是否支持直接下载 ZIP（默认 true；为 false 时引导用户去官方渠道下载）。
  supports_download_zip: boolean;
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
