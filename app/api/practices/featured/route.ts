import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClientNoStore } from "@/lib/supabase/server";
import { FEATURED_PRACTICE_LIMIT } from "@/lib/constants";

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
    // 性能保护：Hero 卡片使用 3D 叠牌效果，数量过多会造成合成层压力与掉帧。
    // 服务端直接限制返回数量，避免前端拿到超量数据再丢弃。
    .limit(FEATURED_PRACTICE_LIMIT);

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
  // 补充 Skill 名称：practice 与 skill 已为多对多，需要通过 join 表查询。
  if (practices.length > 0) {
    const practiceIds = Array.from(new Set(practices.map((practice) => practice.id)));
    const { data: linkRows, error: linkError } = await supabase
      .from("practice_skills")
      // 读取关联的 Skill 名称，按 is_primary 倒序保证“主 Skill”优先命中。
      .select("practice_id, is_primary, skills(name)")
      .in("practice_id", practiceIds)
      .order("is_primary", { ascending: false });

    if (!linkError && linkRows) {
      const nameMap = new Map<number, string>();
      for (const row of linkRows) {
        const practiceId = row.practice_id;
        /**
         * Supabase 返回的关联字段在类型层面可能是对象或数组：
         * - 多数情况下 skills 为单对象（practice_skills -> skills 是多对一）
         * - 但类型推断可能认为是数组（例如缺少显式关系定义时）
         * 这里统一做兼容，避免 TypeScript 报错与线上空值。
         */
        const skillsField =
          row.skills as unknown as { name?: string | null } | { name?: string | null }[] | null;
        const skillName = Array.isArray(skillsField) ? skillsField[0]?.name : skillsField?.name;
        if (!practiceId || !skillName) {
          continue;
        }
        // 仅在首次写入时赋值：由排序保证优先保留主 Skill 的名称。
        if (!nameMap.has(practiceId)) {
          nameMap.set(practiceId, skillName);
        }
      }

      practices = practices.map((practice) => ({
        ...practice,
        skill_name: nameMap.get(practice.id) ?? null,
      }));
    } else {
      // 关联查询失败时也保证返回字段，避免前端渲染报错。
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
