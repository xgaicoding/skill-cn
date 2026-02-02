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

  /**
   * 详情页实践列表：
   * - 直接从 practices 表筛选 skill_ids，避免 join 排序不稳定的问题
   * - 与首页 practices 列表使用同一排序规则，保证“最热/最新”一致
   *
   * 说明：
   * - skill_ids 由数据库触发器维护（见 supabase/migrations）
   * - 使用 overlaps([skillId]) 即可匹配包含该 skill 的实践
   */
  let query = supabase
    .from("practices")
    .select("id, title, summary, channel, updated_at, source_url, author_name, is_listed, is_featured, click_count", {
      count: "exact",
    })
    // 仅统计/返回上架的实践，保持与列表页统计逻辑一致。
    .eq("is_listed", true)
    // 关联当前 Skill 的实践（skill_ids 数组包含当前 skillId 即可命中）。
    .overlaps("skill_ids", [skillId]);

  // 实践排序：
  // - heat：按点击量（click_count）降序，其次更新时间
  // - recent：按更新时间降序，其次点击量
  if (sort === "recent") {
    query = query
      // 最新优先：更新时间降序，其次点击量。
      .order("updated_at", { ascending: false })
      .order("click_count", { ascending: false });
  } else {
    query = query
      // 最热优先：点击量降序，其次更新时间。
      .order("click_count", { ascending: false })
      .order("updated_at", { ascending: false });
  }

  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 直接返回 practices 表数据，避免 join 结构拍平导致顺序混乱。
  const practices = data || [];

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
