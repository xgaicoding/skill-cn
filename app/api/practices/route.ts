import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * 首页「实践模式（practices mode）」列表接口
 * ------------------------------------------------------------
 * 设计目标（对齐 PRD）：
 * - 支持首页与筛选条一致的参数：tag / q / sort / page / size
 * - 返回实践（practice）列表，同时补充关联 skills（用于卡片左下角展示）
 * - 只返回 is_listed=true 的实践（与现有 Skill 列表、统计口径保持一致）
 *
 * 重要说明：
 * - practices.skill_ids / primary_skill_id 由数据库触发器自动维护（见 supabase/migrations）
 * - 这里用 skill_ids 数组做筛选（overlaps）与展示排序，避免在列表接口里做复杂 join + 去重
 */

/**
 * 强制该路由为动态渲染：
 * - 避免 Next.js 在可静态化时把结果固化到 build 产物里
 * - 避免出现“数据库已更新但线上接口仍返回旧数据”的错觉
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type PracticeRow = {
  id: number;
  title: string;
  summary: string;
  channel: string;
  updated_at: string;
  source_url: string;
  author_name: string | null;
  is_listed: boolean;
  is_featured: boolean;
  click_count: number;
  // 多对多：按关联顺序存储的 skill id 数组（来源：practices 表）
  skill_ids: number[];
  // 主 skill（来源：practices 表）
  primary_skill_id: number | null;
};

type SkillLiteRow = {
  id: number;
  name: string;
  tag: string | null;
};

export async function GET(request: Request) {
  // 运行时兜底：显式禁止 Next 对该请求做缓存。
  noStore();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const size = Math.max(Number(searchParams.get("size") || PAGE_SIZE), 1);
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "heat";

    const supabase = getSupabaseServerClient();

    /**
     * 分类筛选（tag）规则（PRD）：
     * - 选择某分类后，仅展示“关联 Skill 中至少有一个 tag=该分类”的文章
     *
     * 实现策略：
     * - 先查出该 tag 下所有 skill.id
     * - 再用 practices.skill_ids && tagSkillIds（overlaps）完成筛选
     *
     * 这样可以避免 join 去重带来的分页/计数复杂度（列表接口要稳定、可预期）。
     */
    let tagSkillIds: number[] | null = null;
    if (tag && tag !== "全部") {
      const { data: skillsForTag, error: tagError } = await supabase
        .from("skills")
        .select("id")
        // 与首页 Skill 列表口径一致：只把已上架 skills 视为“有效分类成员”
        .eq("is_listed", true)
        .eq("tag", tag);

      if (tagError) {
        return NextResponse.json({ error: tagError.message }, { status: 500 });
      }

      tagSkillIds = (skillsForTag || [])
        .map((row) => Number((row as { id: number }).id))
        .filter((id) => Number.isFinite(id));

      // 该分类下没有任何 skill：直接返回空结果（避免继续扫 practices 表）。
      if (tagSkillIds.length === 0) {
        return NextResponse.json({
          data: [],
          page,
          size,
          total: 0,
          totalPages: 1,
        });
      }
    }

    let query = supabase
      .from("practices")
      .select(
        "id, title, summary, channel, updated_at, source_url, author_name, is_listed, is_featured, click_count, skill_ids, primary_skill_id",
        { count: "exact" },
      )
      .eq("is_listed", true);

    // 实践搜索（PRD）：仅匹配 title / summary（不包含作者与关联 skill 名称）。
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`title.ilike.${pattern},summary.ilike.${pattern}`);
    }

    // 分类筛选：skill_ids 与该分类下的 skill.id 有交集即可命中。
    if (tagSkillIds) {
      query = query.overlaps("skill_ids", tagSkillIds);
    }

    // 排序规则（PRD）：
    // - heat：click_count desc, updated_at desc
    // - recent：updated_at desc, click_count desc
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

    const practices = (data || []) as unknown as PracticeRow[];
    const total = count || 0;
    const totalPages = Math.max(Math.ceil(total / size), 1);

    // 没有实践则无需额外查 skills。
    if (practices.length === 0) {
      return NextResponse.json({
        data: [],
        page,
        size,
        total,
        totalPages,
      });
    }

    /**
     * 关联 skills 补全：
     * - practices 表里只有 skill_ids / primary_skill_id（用于排序与展示规则）
     * - 卡片需要 skill 名称（以及 tag，用于后续扩展/调试）
     * 因此这里做一次批量 in 查询，避免 N+1。
     */
    const skillIdSet = new Set<number>();
    for (const practice of practices) {
      for (const id of Array.isArray(practice.skill_ids) ? practice.skill_ids : []) {
        const num = Number(id);
        if (Number.isFinite(num)) {
          skillIdSet.add(num);
        }
      }
    }

    const allSkillIds = Array.from(skillIdSet);
    const { data: skillsData, error: skillsError } = await supabase
      .from("skills")
      .select("id, name, tag")
      .in("id", allSkillIds);

    if (skillsError) {
      // skills 查询失败时也保证接口可用：返回空 skills，避免前端崩溃。
      const degraded = practices.map((practice) => ({
        ...practice,
        skills: [] as SkillLiteRow[],
      }));

      return NextResponse.json({
        data: degraded,
        page,
        size,
        total,
        totalPages,
      });
    }

    const skillMap = new Map<number, SkillLiteRow>();
    for (const row of (skillsData || []) as unknown as SkillLiteRow[]) {
      if (!row?.id) continue;
      skillMap.set(row.id, row);
    }

    // 将 primary_skill_id “提到最前”，其余按 skill_ids 原始顺序补齐（PRD）。
    const enriched = practices.map((practice) => {
      const skillIds = Array.isArray(practice.skill_ids) ? practice.skill_ids : [];
      const primaryId = practice.primary_skill_id ?? null;

      const orderedIds: number[] = [];
      const seen = new Set<number>();

      if (primaryId !== null && skillIds.includes(primaryId)) {
        orderedIds.push(primaryId);
        seen.add(primaryId);
      }

      for (const id of skillIds) {
        if (seen.has(id)) continue;
        orderedIds.push(id);
        seen.add(id);
      }

      const skills = orderedIds
        .map((id) => skillMap.get(id))
        .filter(Boolean) as SkillLiteRow[];

      return {
        ...practice,
        // 这里返回全量 skills，前端再按“最多 3 个 +N”规则展示即可。
        skills,
      };
    });

    return NextResponse.json({
      data: enriched,
      page,
      size,
      total,
      totalPages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
