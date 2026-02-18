import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClientNoStore } from "@/lib/supabase/server";
import type { WeeklyStats } from "@/lib/types";

// 明确声明为动态路由，避免构建期静态化导致“周统计长期不更新”。
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// 按需求：客户端/边缘缓存 5 分钟，兼顾实时性与接口压力。
const WEEKLY_STATS_CACHE_CONTROL = "public, max-age=300";
const DAY_MS = 24 * 60 * 60 * 1000;
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * 计算“本周（UTC+8）”时间范围。
 *
 * 返回值说明：
 * - weekStartUtcIso：用于 SQL `updated_at >= ...` 的 UTC ISO 时间（本周一 00:00（UTC+8）折算到 UTC）
 * - weekStart/weekEnd：给前端展示的 YYYY-MM-DD（UTC+8 口径）
 */
function getUtc8WeekRange(now = new Date()) {
  // 把“当前 UTC 时间”平移到“UTC+8 的虚拟时钟”，便于用 UTC API 直接拿到本地周几与日期。
  const nowUtc8 = new Date(now.getTime() + UTC8_OFFSET_MS);
  const dayOfWeek = nowUtc8.getUTCDay();
  // 周一=0，周日=6。
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  // 先得到“UTC+8 今天 00:00”的日期锚点（以 UTC Date API 表示，避免本机时区干扰）。
  const todayUtc8DateAnchor = Date.UTC(
    nowUtc8.getUTCFullYear(),
    nowUtc8.getUTCMonth(),
    nowUtc8.getUTCDate(),
  );

  const weekStartDateAnchor = todayUtc8DateAnchor - daysSinceMonday * DAY_MS;
  const weekEndDateAnchor = weekStartDateAnchor + 6 * DAY_MS;

  // UTC+8 的周一 00:00 要用于数据库比较，需要回拨 8 小时变成 UTC 时间。
  const weekStartUtcMs = weekStartDateAnchor - UTC8_OFFSET_MS;

  return {
    weekStartUtcIso: new Date(weekStartUtcMs).toISOString(),
    weekStart: new Date(weekStartDateAnchor).toISOString().slice(0, 10),
    weekEnd: new Date(weekEndDateAnchor).toISOString().slice(0, 10),
  };
}

export async function GET() {
  // 运行时兜底：明确告诉 Next 该请求不能走 Data Cache。
  noStore();

  try {
    const supabase = getSupabaseServerClientNoStore();
    const weekRange = getUtc8WeekRange();

    const [newPracticesResult, totalPracticesResult, totalSkillsResult] = await Promise.all([
      supabase
        .from("practices")
        .select("id", { count: "exact", head: true })
        .eq("is_listed", true)
        .gte("updated_at", weekRange.weekStartUtcIso),
      supabase
        .from("practices")
        .select("id", { count: "exact", head: true })
        .eq("is_listed", true),
      supabase
        .from("skills")
        .select("id", { count: "exact", head: true })
        .eq("is_listed", true),
    ]);

    const firstError =
      newPracticesResult.error ||
      totalPracticesResult.error ||
      totalSkillsResult.error;

    if (firstError) {
      return NextResponse.json(
        { error: firstError.message },
        {
          status: 500,
          headers: {
            // 错误响应不缓存，避免短暂异常被 5 分钟缓存放大。
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const payload: WeeklyStats = {
      newPracticesThisWeek: newPracticesResult.count || 0,
      totalPractices: totalPracticesResult.count || 0,
      totalSkills: totalSkillsResult.count || 0,
      weekStart: weekRange.weekStart,
      weekEnd: weekRange.weekEnd,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": WEEKLY_STATS_CACHE_CONTROL,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
