import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const size = Math.max(Number(searchParams.get("size") || PAGE_SIZE), 1);
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "heat";

    const supabase = getSupabaseServerClient();

    let query = supabase
      .from("skills")
      .select(
        // supports_download_zip 用于前端判断是否展示“直接下载”入口
        "id, name, description, tag, source_url, supports_download_zip, download_count, heat_score, repo_stars, repo_owner_name, repo_owner_avatar_url, updated_at",
        { count: "exact" }
      )
      .eq("is_listed", true);

    if (tag && tag !== "全部") {
      query = query.eq("tag", tag);
    }

    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`name.ilike.${pattern},description.ilike.${pattern},tag.ilike.${pattern}`);
    }

    if (sort === "recent") {
      query = query
        .order("updated_at", { ascending: false })
        .order("heat_score", { ascending: false })
        .order("repo_stars", { ascending: false })
        .order("id", { ascending: true });
    } else {
      query = query
        .order("heat_score", { ascending: false })
        .order("updated_at", { ascending: false })
        .order("repo_stars", { ascending: false })
        .order("id", { ascending: true });
    }

    const from = (page - 1) * size;
    const to = from + size - 1;

    const { data, error, count } = await query.range(from, to);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.max(Math.ceil(total / size), 1);

    // practice_count 需要以 practices 表为准（只统计 is_listed=true）。
    // 优先使用 RPC 在数据库层完成聚合，失败时降级为 join 查询，避免首页显示空值。
    let skills = data || [];
    if (skills.length > 0) {
      const skillIds = skills.map((skill) => skill.id);
      const { data: practiceCountsData, error: practiceCountsError } = await supabase.rpc(
        "get_practice_counts_for_skills",
        { skill_ids: skillIds },
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
        // 降级方案：直接基于 join 表统计实践数量（仅统计已上架实践）。
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
          // 再兜底：确保前端始终拿到 practice_count 字段，避免空显示。
          skills = skills.map((skill) => ({
            ...skill,
            practice_count: 0,
          }));
        }
      }
    }

    return NextResponse.json({
      data: skills,
      page,
      size,
      total,
      totalPages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
