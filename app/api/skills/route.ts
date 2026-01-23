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

    let query = supabase.from("skills").select("*", { count: "exact" }).eq("is_listed", true);

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
    // 由于当前未在 DB 侧做触发器维护，这里按页补齐，确保列表展示准确。
    let skills = data || [];
    if (skills.length > 0) {
      const skillIds = skills.map((skill) => skill.id);
      const { data: practiceRows, error: practiceError } = await supabase
        .from("practices")
        .select("skill_id")
        .in("skill_id", skillIds)
        .eq("is_listed", true);

      if (!practiceError && practiceRows) {
        const countMap = new Map<number, number>();
        for (const row of practiceRows) {
          const current = countMap.get(row.skill_id) || 0;
          countMap.set(row.skill_id, current + 1);
        }

        skills = skills.map((skill) => ({
          ...skill,
          practice_count: countMap.get(skill.id) ?? 0,
        }));
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
