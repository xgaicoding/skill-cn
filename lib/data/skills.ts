import { PAGE_SIZE } from "@/lib/constants";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Paginated, Skill } from "@/lib/types";

/**
 * Skill list query params shared by SSR and API.
 *
 * Notes:
 * - `ids` should be sanitized by the caller (no raw comma string here)
 * - `sort` only supports "heat" / "recent"; any other value falls back to "heat"
 */
export type SkillListQuery = {
  page?: number;
  size?: number;
  tag?: string | null;
  q?: string | null;
  ids?: number[];
  sort?: string | null;
};

/**
 * Fetch skill list with practice_count aggregation.
 *
 * Design goals:
 * - Reuse one query path for SSR and /api/skills to avoid drift
 * - Keep practice_count aligned with list/detail: only count practices where is_listed=true
 */
export async function fetchSkillList(query: SkillListQuery = {}): Promise<Paginated<Skill>> {
  // page/size guards: avoid 0/negative values causing invalid range
  const page = Math.max(Number(query.page ?? 1), 1);
  const size = Math.max(Number(query.size ?? PAGE_SIZE), 1);
  const sort = query.sort === "recent" ? "recent" : "heat";

  // Keep only valid positive integers to avoid bloated/invalid SQL IN lists
  const ids = (query.ids || [])
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num) && num > 0);
  const uniqueIds = Array.from(new Set(ids));

  const supabase = getSupabaseServerClient();

  let builder = supabase
    .from("skills")
    .select(
      // Only select fields needed by the list view (exclude heavy detail fields like markdown)
      "id, name, description, tag, source_url, is_package, supports_download_zip, download_count, heat_score, repo_stars, repo_owner_name, repo_owner_avatar_url, updated_at",
      { count: "exact" }
    )
    .eq("is_listed", true);

  // ids filter has the highest priority: narrow the set before other filters
  if (uniqueIds.length > 0) {
    builder = builder.in("id", uniqueIds);
  }

  if (query.tag && query.tag !== "全部") {
    builder = builder.eq("tag", query.tag);
  }

  if (query.q) {
    const pattern = `%${query.q}%`;
    builder = builder.or(`name.ilike.${pattern},description.ilike.${pattern},tag.ilike.${pattern}`);
  }

  // Keep sorting consistent with existing API behavior
  if (sort === "recent") {
    builder = builder
      .order("updated_at", { ascending: false })
      .order("heat_score", { ascending: false })
      .order("repo_stars", { ascending: false })
      .order("id", { ascending: true });
  } else {
    builder = builder
      .order("heat_score", { ascending: false })
      .order("updated_at", { ascending: false })
      .order("repo_stars", { ascending: false })
      .order("id", { ascending: true });
  }

  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data, error, count } = await builder.range(from, to);
  if (error) {
    // Throw and let the caller (API/SSR) decide how to handle
    throw new Error(error.message);
  }

  const total = count || 0;
  const totalPages = Math.max(Math.ceil(total / size), 1);

  // practice_count must be based on practices table (only is_listed=true)
  let skills = (data || []) as Skill[];
  if (skills.length > 0) {
    const skillIds = skills.map((skill) => skill.id);
    const { data: practiceCountsData, error: practiceCountsError } = await supabase.rpc(
      "get_practice_counts_for_skills",
      { skill_ids: skillIds }
    );

    if (!practiceCountsError && practiceCountsData) {
      const countMap = new Map<number, number>();
      for (const row of practiceCountsData) {
        countMap.set(row.skill_id, row.practice_count);
      }

      skills = skills.map((skill) => ({
        ...skill,
        practice_count: countMap.get(skill.id) ?? 0,
      }));
    } else {
      /**
       * Fallback: aggregate via join table when RPC is unavailable.
       * - Ensures practice_count exists even if RPC fails
       */
      const { data: linkRows, error: linkError } = await supabase
        .from("practice_skills")
        .select("skill_id, practice_id, practices!inner(id)")
        .in("skill_id", skillIds)
        .eq("practices.is_listed", true);

      if (!linkError && linkRows) {
        const countMap = new Map<number, number>();
        for (const row of linkRows) {
          if (!row?.skill_id || !row?.practice_id) {
            continue;
          }
          countMap.set(row.skill_id, (countMap.get(row.skill_id) ?? 0) + 1);
        }

        skills = skills.map((skill) => ({
          ...skill,
          practice_count: countMap.get(skill.id) ?? 0,
        }));
      } else {
        // Final fallback: keep practice_count defined to avoid UI errors
        skills = skills.map((skill) => ({
          ...skill,
          practice_count: 0,
        }));
      }
    }
  }

  return {
    data: skills,
    page,
    size,
    total,
    totalPages,
  };
}
