import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { syncSkillFromGitHub } from "@/lib/github/github";

const TIMEOUT_MS = 5000;
export const runtime = "nodejs";

async function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), ms);
  });
  const result = (await Promise.race([promise, timeoutPromise])) as T;
  clearTimeout(timeoutId!);
  return result;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // 读取刷新模式：
  // - refresh=1：强制同步 GitHub（慢，但数据新）
  // - refresh!=1：直接返回缓存（快），由客户端异步触发刷新
  const { searchParams } = new URL(request.url);
  const shouldRefresh = searchParams.get("refresh") === "1";

  const { data: skill, error } = await supabase.from("skills").select("*").eq("id", id).single();
  if (error || !skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  // practice_count 以 practices 表为准（仅统计上架实践），确保详情页与列表一致。
  // 注意：practice 与 skill 已改为多对多关系，需要通过 join 表统计。
  const { count: practiceCount } = await supabase
    .from("practice_skills")
    // 通过 inner join 过滤 practices.is_listed，避免把下架实践计入数量。
    .select("practice_id, practices!inner(id)", { count: "exact", head: true })
    .eq("skill_id", id)
    .eq("practices.is_listed", true);

  const skillWithPractice = {
    ...skill,
    practice_count: practiceCount ?? 0,
  };

  // 默认快速返回缓存，保证详情页“立即可见”。
  if (!shouldRefresh) {
    return NextResponse.json({ data: skillWithPractice, source: "cache" });
  }

  try {
    // 用最新的 practice_count 参与热度计算，避免缓存旧值导致热度偏低。
    const updates = await withTimeout(syncSkillFromGitHub(skillWithPractice), TIMEOUT_MS);
    const { data: updated, error: updateError } = await supabase
      .from("skills")
      .update({
        repo_stars: updates.repo_stars,
        repo_owner_name: updates.repo_owner_name,
        repo_owner_avatar_url: updates.repo_owner_avatar_url,
        updated_at: updates.updated_at,
        markdown: updates.markdown,
        markdown_render_mode: updates.markdown_render_mode,
        heat_score: updates.heat_score,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ data: skillWithPractice, source: "cache" });
    }
    return NextResponse.json({
      data: { ...updated, practice_count: practiceCount ?? 0 },
      source: "github",
    });
  } catch (err) {
    return NextResponse.json({ data: skillWithPractice, source: "cache" });
  }
}
