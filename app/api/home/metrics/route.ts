import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClientNoStore } from "@/lib/supabase/server";
import type { HomeMetrics } from "@/lib/types";

/**
 * 首页 KPI 聚合接口（v1.5.7）
 * ------------------------------------------------------------
 * 目标：一次性返回 PC 首屏需要的 4 个核心指标，避免前端并发多个统计请求。
 *
 * 缓存策略：
 * - 指标要体现“近期变化”，因此显式禁用静态化与中间缓存。
 * - 与 featured/hot 榜单保持同口径：每次请求都从数据库读取。
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * 对 skills.download_count 做全量累加。
 * ------------------------------------------------------------
 * 为什么分批：
 * - PostgREST 默认单次返回行数有限（常见为 1000）。
 * - 直接一次 select 可能在技能量增长后被截断，导致统计偏小。
 *
 * 因此这里按批次拉取并累加，保证口径稳定。
 */
async function sumListedSkillDownloads(supabase: ReturnType<typeof getSupabaseServerClientNoStore>) {
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

export async function GET() {
  noStore();

  const supabase = getSupabaseServerClientNoStore();
  const now = Date.now();
  const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 指标默认值均为 null，前端会统一降级为 `—`。
  const metrics: HomeMetrics = {
    practice_total: null,
    practice_weekly_new: null,
    skill_featured_total: null,
    download_total: null,
    metrics_updated_at: new Date(now).toISOString(),
  };

  const errors: string[] = [];

  /**
   * 口径说明：
   * - skill_featured_total 当前先使用“已上架 Skill 总量”作为稳定口径。
   * - 原因：skills 表暂无显式 is_featured 字段，后续若补充字段可平滑切换。
   */
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

  if (practiceTotalRes.status === "fulfilled") {
    if (practiceTotalRes.value.error) {
      errors.push(practiceTotalRes.value.error.message);
    } else {
      metrics.practice_total = practiceTotalRes.value.count ?? 0;
    }
  } else {
    errors.push(String(practiceTotalRes.reason));
  }

  if (weeklyNewRes.status === "fulfilled") {
    if (weeklyNewRes.value.error) {
      errors.push(weeklyNewRes.value.error.message);
    } else {
      metrics.practice_weekly_new = weeklyNewRes.value.count ?? 0;
    }
  } else {
    errors.push(String(weeklyNewRes.reason));
  }

  if (listedSkillTotalRes.status === "fulfilled") {
    if (listedSkillTotalRes.value.error) {
      errors.push(listedSkillTotalRes.value.error.message);
    } else {
      metrics.skill_featured_total = listedSkillTotalRes.value.count ?? 0;
    }
  } else {
    errors.push(String(listedSkillTotalRes.reason));
  }

  if (downloadTotalRes.status === "fulfilled") {
    metrics.download_total = downloadTotalRes.value;
  } else {
    errors.push(String(downloadTotalRes.reason));
  }

  // 与其它实时接口保持一致，禁止浏览器与代理层缓存响应。
  return NextResponse.json(
    {
      data: metrics,
      degraded: errors.length > 0,
      // 仅返回错误数量用于观测，避免把数据库细节直接暴露给前端。
      error_count: errors.length,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    }
  );
}
