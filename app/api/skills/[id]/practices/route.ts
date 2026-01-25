import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const skillId = Number(params.id);
  if (Number.isNaN(skillId)) {
    return NextResponse.json({ error: "Invalid skill id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);
  const size = Math.max(Number(searchParams.get("size") || PAGE_SIZE), 1);
  const sort = searchParams.get("sort") || "heat";

  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("practice_skills")
    // 通过 join 表拿到 practice，避免依赖 practices.skill_id（已迁移为多对多关系）。
    .select("practices!inner(*)", { count: "exact" })
    .eq("skill_id", skillId)
    // 仅统计/返回上架的实践，保持与列表页统计逻辑一致。
    .eq("practices.is_listed", true);

  // 实践排序：
  // - heat：按点击量（click_count）降序，其次更新时间
  // - recent：按更新时间降序，其次点击量
  if (sort === "recent") {
    query = query
      // 注意：排序字段属于 practices 表，需要指定 foreignTable。
      .order("updated_at", { ascending: false, foreignTable: "practices" })
      .order("click_count", { ascending: false, foreignTable: "practices" });
  } else {
    query = query
      // 默认按热度（点击量）排序，其次按更新时间，均来自 practices 表。
      .order("click_count", { ascending: false, foreignTable: "practices" })
      .order("updated_at", { ascending: false, foreignTable: "practices" });
  }

  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 将 join 查询返回的结构拍平成 practices 数组，避免前端改动。
  const practices = (data || [])
    .map((row: { practices?: Record<string, unknown> | null }) => row.practices)
    .filter(Boolean);

  const total = count || 0;
  const totalPages = Math.max(Math.ceil(total / size), 1);

  return NextResponse.json({
    data: practices,
    page,
    size,
    total,
    totalPages,
  });
}
