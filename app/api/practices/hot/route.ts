import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClientNoStore } from "@/lib/supabase/server";
import type { BoardEntry } from "@/lib/types";

/**
 * 热门榜单接口（v1.5.7）
 * ------------------------------------------------------------
 * 口径：
 * - 固定近 7 天窗口（window=7d）
 * - 排序：click_count DESC, updated_at DESC
 * - 仅返回 is_listed=true 的实践
 *
 * 备注：
 * - 本期热门榜单不展示排名，因此接口不返回 rank 字段。
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 30;

function resolveLimit(raw: string | null): number {
  const parsed = Number(raw || DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(Math.floor(parsed), MAX_LIMIT));
}

export async function GET(request: Request) {
  noStore();

  const supabase = getSupabaseServerClientNoStore();
  const { searchParams } = new URL(request.url);

  // 产品决策：热门窗口固定 7 天。即便外部传入其它 window，也忽略并按 7d 执行。
  const windowDays = 7;
  const limit = resolveLimit(searchParams.get("limit"));
  const windowStartIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("practices")
    .select("id, title, summary, channel, updated_at, source_url, author_name, is_listed, click_count")
    .eq("is_listed", true)
    .gte("updated_at", windowStartIso)
    .order("click_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      }
    );
  }

  const practices = (data || []) as Array<{
    id: number;
    title: string;
    summary: string;
    channel: string;
    updated_at: string;
    source_url: string;
    author_name: string | null;
  }>;

  let entries: BoardEntry[] = practices.map((practice) => ({
    ...practice,
    // skill_name 会在后续关联查询中覆盖；先给 null 作为安全默认值。
    skill_name: null,
  }));

  // 补充 skill_name：通过 practice_skills 取每篇实践的主 Skill（is_primary=true 优先）。
  if (practices.length > 0) {
    const practiceIds = Array.from(new Set(practices.map((practice) => practice.id)));
    const { data: linkRows, error: linkError } = await supabase
      .from("practice_skills")
      .select("practice_id, is_primary, skills(name)")
      .in("practice_id", practiceIds)
      .order("is_primary", { ascending: false });

    if (!linkError && linkRows) {
      const skillNameMap = new Map<number, string>();

      for (const row of linkRows as Array<{
        practice_id: number;
        is_primary: boolean | null;
        skills: { name?: string | null } | { name?: string | null }[] | null;
      }>) {
        const practiceId = row.practice_id;
        const skillName = Array.isArray(row.skills) ? row.skills[0]?.name : row.skills?.name;

        if (!practiceId || !skillName) {
          continue;
        }

        // 首次命中即保留：借助 is_primary DESC，优先拿到主 Skill 名称。
        if (!skillNameMap.has(practiceId)) {
          skillNameMap.set(practiceId, skillName);
        }
      }

      entries = entries.map((entry) => ({
        ...entry,
        skill_name: skillNameMap.get(entry.id) ?? null,
      }));
    }
  }

  return NextResponse.json(
    {
      data: entries,
      meta: {
        window: "7d",
        limit,
      },
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
