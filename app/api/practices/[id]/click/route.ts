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

  // 使用原子操作函数替换非原子的读取→增加→写回模式
  const { data, error } = await supabase.rpc('increment_practice_click', {
    practice_id: id
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 如果返回 null，说明没有找到对应的 practice
  if (data === null) {
    return NextResponse.json({ error: "Practice not found" }, { status: 404 });
  }

  return NextResponse.json({ click_count: data });
}
