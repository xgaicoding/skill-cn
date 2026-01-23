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
    .from("practices")
    .select("*", { count: "exact" })
    .eq("skill_id", skillId)
    .eq("is_listed", true);

  // 实践排序：
  // - heat：按点击量（click_count）降序，其次更新时间
  // - recent：按更新时间降序，其次点击量
  if (sort === "recent") {
    query = query.order("updated_at", { ascending: false }).order("click_count", { ascending: false });
  } else {
    query = query.order("click_count", { ascending: false }).order("updated_at", { ascending: false });
  }

  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  const totalPages = Math.max(Math.ceil(total / size), 1);

  return NextResponse.json({
    data: data || [],
    page,
    size,
    total,
    totalPages,
  });
}
