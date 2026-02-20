export type Skill = {
  id: number;
  name: string;
  description: string;
  tag: string;
  source_url: string;
  is_listed: boolean;
  /**
   * 是否为“技能包”：
   * - true：该 Skill 代表一组 skills 的合集概念（详情页需展示「技能包」Label）
   * - false：普通单一 Skill（默认）
   */
  is_package: boolean;
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
  /**
   * npx 下载/安装指令：
   * - 仅 PC 端详情页展示（下载按钮下方），用于一键复制
   * - 允许为空：不配置时不展示，不影响 ZIP 下载/外链下载
   */
  npx_download_command: string | null;
};

/**
 * SkillLite：
 * - 用于“实践模式（practices mode）”卡片展示的轻量 Skill 信息
 * - 只包含卡片渲染需要的字段，避免把详情页字段（markdown 等）也塞进列表接口
 */
export type SkillLite = {
  id: number;
  name: string;
  tag: string | null;
};

export type Practice = {
  id: number;
  // 首页 Hero 推荐卡片使用的关联 Skill 名称（由 API 补充注入）。
  skill_name?: string | null;
  // 多对多关系下可能关联多个 Skill（当前接口不返回，预留扩展）。
  skill_ids?: number[];
  // 如果存在“主 Skill”，可通过该字段标记（当前接口不返回，预留扩展）。
  primary_skill_id?: number | null;
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

/**
 * PracticeWithSkills：
 * - 首页「实践模式」需要展示“关联 Skills（最多 3 个 +N）”
 * - 列表接口会返回：
 *   - practices.skill_ids / primary_skill_id（用于排序与展示规则）
 *   - skills[]（用于渲染名称/标签）
 */
export type PracticeWithSkills = Practice & {
  skill_ids: number[];
  primary_skill_id: number | null;
  skills: SkillLite[];
};

/**
 * 首页首屏 KPI 聚合数据（v1.5.7）
 * ------------------------------------------------------------
 * 用途：
 * - 仅用于 PC 首屏「更新看板」的 4 个关键指标展示
 * - 字段全部使用 number | null，便于前端在接口异常或口径缺失时安全降级为 `—`
 */
export type HomeMetrics = {
  // 案例数量：站点已收录实践总数
  practice_total: number | null;
  // 本周上新：近 7 天新增或更新实践数
  practice_weekly_new: number | null;
  // 精选 Skill：由精选实践反推的关联 Skill 去重数量（无数据时可回退为 skill 总量）
  skill_featured_total: number | null;
  // 下载总量：全站累计下载/安装次数
  download_total: number | null;
  // 指标更新时间（可选）：用于后续展示“数据刷新时间”
  metrics_updated_at?: string | null;
};

/**
 * 榜单条目（每周精选 / 热门榜单统一结构）
 * ------------------------------------------------------------
 * 设计目标：
 * - 两个 Tab 复用同一套卡片渲染，避免样式和字段分叉
 * - 明确不包含 ranking 字段（热门榜单本期不展示排名）
 */
export type BoardEntry = {
  id: number;
  title: string;
  summary: string;
  channel: string;
  author_name: string | null;
  source_url: string;
  updated_at: string;
  // 右下角 Skill chip 展示名（来自关联 skill）
  skill_name: string | null;
};

/**
 * 榜单 Tab key（v1.5.7）
 * - weekly：每周精选
 * - hot：热门榜单（近 7 天）
 */
export type BoardTabKey = "weekly" | "hot";

export type Paginated<T> = {
  data: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};
