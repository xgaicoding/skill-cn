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

  // 使用原子操作函数替换非原子的读取→增加→写回模式
  const { data, error } = await supabase.rpc('increment_skill_download', {
    skill_id: id
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 如果返回 null，说明没有找到对应的 skill
  if (data === null) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json({ download_count: data });
}
