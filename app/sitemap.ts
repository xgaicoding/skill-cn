import type { MetadataRoute } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

/**
 * Sitemap 采用 ISR 缓存：
 * - 避免每次请求都直连数据库
 * - 结合数据更新频率，按小时级别刷新即可
 */
export const revalidate = 60 * 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const supabase = getSupabaseServerClient();

  /**
   * 仅收录已上架 Skill：
   * - 与站点实际对外展示一致
   * - 避免爬虫索引“未发布/下架”内容
   */
  const { data, error } = await supabase
    .from("skills")
    .select("id, updated_at")
    .eq("is_listed", true);

  /**
   * 首页 lastModified 的估算口径：
   * - 取 practices 最新更新时间（若查询失败则回退到当前时间）
   * - 这样搜索引擎能更快感知“首页内容有更新”
   */
  const { data: latestPracticeRows } = await supabase
    .from("practices")
    .select("updated_at")
    .eq("is_listed", true)
    .order("updated_at", { ascending: false })
    .limit(1);
  const homepageLastModified = latestPracticeRows?.[0]?.updated_at
    ? new Date(latestPracticeRows[0].updated_at)
    : new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteUrl).toString(),
      changeFrequency: "daily",
      priority: 1.0,
      lastModified: homepageLastModified,
    },
  ];

  // 若数据库查询失败，仍返回首页入口，保证 sitemap 可访问。
  if (error || !data) {
    return entries;
  }

  const detailEntries = data.map((skill) => ({
    url: new URL(`/skill/${skill.id}`, siteUrl).toString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
    lastModified: skill.updated_at ? new Date(skill.updated_at) : undefined,
  }));

  return [...entries, ...detailEntries];
}
