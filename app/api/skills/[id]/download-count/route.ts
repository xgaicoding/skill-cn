import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 该接口涉及服务端环境变量（Service Role Key）与数据库写入：
 * - 明确指定 runtime 为 nodejs，避免在 Edge Runtime 下出现不一致行为
 * - 同时也能避免 Next 在构建阶段对 runtime 的推断产生歧义
 */
export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("skills").select("download_count").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const nextCount = (data.download_count || 0) + 1;
  const { error: updateError } = await supabase
    .from("skills")
    .update({ download_count: nextCount })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ download_count: nextCount });
}
