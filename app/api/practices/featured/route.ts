import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClientNoStore } from "@/lib/supabase/server";

/**
 * 关键：让 /api/practices/featured “实时动态”返回最新数据。
 *
 * Next.js（App Router）会在可静态化时对路由进行静态优化：
 * - 如果路由被判定为可静态化，可能在 build 阶段把结果固化成静态产物
 * - 这样即使你在 Supabase 里改了数据，线上接口也会继续返回旧数据（直到重新部署/重新 build）
 *
 * 这里强制该路由为动态渲染，确保每次请求都会重新查询 Supabase。
 */
export const dynamic = "force-dynamic";
// 进一步确保该路由不参与 ISR / 静态化缓存。
export const revalidate = 0;
// 强制该路由内所有 `fetch` 默认走 no-store（包含 supabase-js 内部的 fetch 调用）。
export const fetchCache = "force-no-store";

export async function GET() {
  // 在运行时层面再“兜底”一次：显式告诉 Next 这次请求不应被缓存。
  noStore();

  // 使用强制 no-store 的 Supabase client，避免 Next Data Cache 造成的“数据不更新”。
  const supabase = getSupabaseServerClientNoStore();
  const { data, error } = await supabase
    .from("practices")
    // 先取精选实践主体数据，再补充关联 Skill 名称。
    .select("*")
    .is("is_listed", true)
    .is("is_featured", true)
    .order("updated_at", { ascending: false })
    .limit(6);

  if (error) {
    // 明确禁止任何中间层缓存错误响应，避免“短暂故障被缓存”导致长时间不可用。
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: {
          // 多浏览器/多代理兼容写法，尽量彻底禁用缓存。
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        },
      },
    );
  }

  let practices = data || [];
  // 补充 Skill 名称：避免依赖 DB 外键关系配置，直接按 skill_id 二次查询。
  if (practices.length > 0) {
    const skillIds = Array.from(new Set(practices.map((practice) => practice.skill_id)));
    const { data: skillRows, error: skillError } = await supabase
      .from("skills")
      .select("id, name")
      .in("id", skillIds);

    if (!skillError && skillRows) {
      const nameMap = new Map<number, string>();
      for (const skill of skillRows) {
        nameMap.set(skill.id, skill.name);
      }

      practices = practices.map((practice) => ({
        ...practice,
        skill_name: nameMap.get(practice.skill_id) ?? null,
      }));
    } else {
      // skill 查询失败时也保证返回字段，避免前端渲染报错。
      practices = practices.map((practice) => ({
        ...practice,
        skill_name: null,
      }));
    }
  }

  // 再补一层 HTTP 缓存策略，避免浏览器/CDN/代理缓存导致“数据不更新”的错觉。
  return NextResponse.json(
    { data: practices },
    {
      headers: {
        // 多浏览器/多代理兼容写法，尽量彻底禁用缓存。
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    },
  );
}
