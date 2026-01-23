import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Click 计数属于服务端写操作：
 * - 显式声明 runtime 为 nodejs，避免 Edge 环境下的依赖/权限差异
 * - 也用于提升构建阶段路由解析的确定性
 */
export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("practices").select("click_count").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: "Practice not found" }, { status: 404 });
  }

  const nextCount = (data.click_count || 0) + 1;
  const { error: updateError } = await supabase
    .from("practices")
    .update({ click_count: nextCount })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ click_count: nextCount });
}
