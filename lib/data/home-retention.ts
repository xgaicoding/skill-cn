import { FEATURED_PRACTICE_LIMIT } from "@/lib/constants";
import type { BoardEntry, HomeMetrics, Practice } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 首页“每周精选/热门榜单”与 KPI 预取数据服务（Server）。
 * ------------------------------------------------------------------
 * 设计目标：
 * 1) 给首页首屏提供 SSR 数据，避免首屏 HTML 只有骨架，提升 SEO 抓取质量
 * 2) 与现有 API 口径保持一致，避免“服务端首屏”和“客户端二次请求”数据语义分叉
 * 3) 失败可降级：任一子查询失败时不抛出到页面层，返回空集合或 null 字段
 */

type PracticeSkillLinkRow = {
  practice_id: number;
  is_primary: boolean | null;
  skills: { name?: string | null } | { name?: string | null }[] | null;
};

/**
 * 复用的 Skill 名称补全逻辑：
 * - 一篇实践可能关联多个 Skill（多对多）
 * - 通过 `is_primary DESC` 让“主 Skill”优先命中并写入 map
 */
async function buildPracticeSkillNameMap(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  practiceIds: number[]
): Promise<Map<number, string>> {
  const skillNameMap = new Map<number, string>();
  if (practiceIds.length === 0) {
    return skillNameMap;
  }

  const { data: linkRows, error: linkError } = await supabase
    .from("practice_skills")
    .select("practice_id, is_primary, skills(name)")
    .in("practice_id", practiceIds)
    .order("is_primary", { ascending: false });

  if (linkError || !linkRows) {
    return skillNameMap;
  }

  for (const row of linkRows as PracticeSkillLinkRow[]) {
    const practiceId = row.practice_id;
    const skillName = Array.isArray(row.skills) ? row.skills[0]?.name : row.skills?.name;
    if (!practiceId || !skillName) {
      continue;
    }
    if (!skillNameMap.has(practiceId)) {
      skillNameMap.set(practiceId, skillName);
    }
  }

  return skillNameMap;
}

/**
 * 首屏“每周精选”数据（SSR）：
 * - 与 `/api/practices/featured` 保持同口径
 * - 仅拉取已上架 + 已精选实践，按更新时间倒序
 */
export async function fetchHomeFeaturedPractices(limit = FEATURED_PRACTICE_LIMIT): Promise<Practice[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("practices")
    .select("*")
    .eq("is_listed", true)
    .eq("is_featured", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const practices = data as Practice[];
  if (practices.length === 0) {
    return [];
  }

  const practiceIds = Array.from(new Set(practices.map((practice) => practice.id)));
  const skillNameMap = await buildPracticeSkillNameMap(supabase, practiceIds);

  return practices.map((practice) => ({
    ...practice,
    skill_name: skillNameMap.get(practice.id) ?? null,
  }));
}

/**
 * 首屏“热门榜单”数据（SSR）：
 * - 与 `/api/practices/hot` 保持同口径（近 7 天 + 点击量优先）
 * - 结果结构直接对齐 HomeRetentionBanner 的 BoardEntry
 */
export async function fetchHomeHotBoardEntries(limit = 9): Promise<BoardEntry[]> {
  const supabase = getSupabaseServerClient();
  const windowStartIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("practices")
    .select("id, title, summary, channel, updated_at, source_url, author_name, is_listed, click_count")
    .eq("is_listed", true)
    .gte("updated_at", windowStartIso)
    .order("click_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const practices = data as Array<{
    id: number;
    title: string;
    summary: string;
    channel: string;
    updated_at: string;
    source_url: string;
    author_name: string | null;
  }>;

  const practiceIds = Array.from(new Set(practices.map((practice) => practice.id)));
  const skillNameMap = await buildPracticeSkillNameMap(supabase, practiceIds);

  return practices.map((practice) => ({
    ...practice,
    skill_name: skillNameMap.get(practice.id) ?? null,
  }));
}

/**
 * 下载总量聚合（与首页 KPI 口径一致）：
 * - skills 可能超过单页上限，必须分批读取后累加
 */
async function sumListedSkillDownloads(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const pageSize = 1000;
  let from = 0;
  let total = 0;

  while (true) {
    const { data, error } = await supabase
      .from("skills")
      .select("download_count")
      .eq("is_listed", true)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      break;
    }

    for (const row of data as Array<{ download_count: number | null }>) {
      const value = Number(row.download_count);
      if (Number.isFinite(value) && value > 0) {
        total += value;
      }
    }

    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return total;
}

/**
 * 首页 KPI 数据（SSR）：
 * - 与 `/api/home/metrics` 同口径
 * - 任一子项失败时仅该字段降级为 null，不阻断页面
 */
export async function fetchHomeMetricsSnapshot(): Promise<HomeMetrics> {
  const supabase = getSupabaseServerClient();
  const now = Date.now();
  const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const metrics: HomeMetrics = {
    practice_total: null,
    practice_weekly_new: null,
    skill_featured_total: null,
    download_total: null,
    metrics_updated_at: new Date(now).toISOString(),
  };

  const [practiceTotalRes, weeklyNewRes, listedSkillTotalRes, downloadTotalRes] = await Promise.allSettled([
    supabase.from("practices").select("id", { count: "exact", head: true }).eq("is_listed", true),
    supabase
      .from("practices")
      .select("id", { count: "exact", head: true })
      .eq("is_listed", true)
      .gte("updated_at", sevenDaysAgoIso),
    supabase.from("skills").select("id", { count: "exact", head: true }).eq("is_listed", true),
    sumListedSkillDownloads(supabase),
  ]);

  if (practiceTotalRes.status === "fulfilled" && !practiceTotalRes.value.error) {
    metrics.practice_total = practiceTotalRes.value.count ?? 0;
  }

  if (weeklyNewRes.status === "fulfilled" && !weeklyNewRes.value.error) {
    metrics.practice_weekly_new = weeklyNewRes.value.count ?? 0;
  }

  if (listedSkillTotalRes.status === "fulfilled" && !listedSkillTotalRes.value.error) {
    metrics.skill_featured_total = listedSkillTotalRes.value.count ?? 0;
  }

  if (downloadTotalRes.status === "fulfilled") {
    metrics.download_total = downloadTotalRes.value;
  }

  return metrics;
}
