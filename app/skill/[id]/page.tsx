import type { Metadata } from "next";
import DetailPage from "@/components/detail/DetailPage";
import { headers } from "next/headers";
import { detectDeviceKindFromUA } from "@/lib/device";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Skill } from "@/lib/types";
import { getSiteUrl } from "@/lib/site";

/**
 * 详情页数据获取（服务端）：
 * - 用 cache 包一层，避免 generateMetadata 与 Page 重复请求数据库
 * - 仅查询详情页渲染需要的字段，控制 TTFB 与数据体积
 */
const fetchSkillDetail = cache(async (id: number) => {
  const supabase = getSupabaseServerClient();

  const { data: skill, error } = await supabase
    .from("skills")
    .select(
      "id, name, description, tag, source_url, is_package, supports_download_zip, download_count, heat_score, repo_stars, repo_owner_name, repo_owner_avatar_url, updated_at, markdown, markdown_render_mode, npx_download_command"
    )
    .eq("id", id)
    .single();

  if (error || !skill) {
    return null;
  }

  /**
   * practice_count 以实践表为准（仅统计已上架实践）：
   * - 与详情 API 的统计口径保持一致
   * - 确保 SSR 输出的计数稳定
   */
  const { count: practiceCount } = await supabase
    .from("practice_skills")
    .select("practice_id, practices!inner(id)", { count: "exact", head: true })
    .eq("skill_id", id)
    .eq("practices.is_listed", true);

  return {
    ...(skill as Skill),
    practice_count: practiceCount ?? 0,
  } as Skill;
});

/**
 * 详情页 Metadata：
 * - 使用数据库字段生成动态 title / description / OG
 * - 若不存在对应 Skill，直接返回 404
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const skillId = Number(params.id);
  if (Number.isNaN(skillId)) {
    notFound();
  }

  const skill = await fetchSkillDetail(skillId);
  if (!skill) {
    notFound();
  }

  const rawDesc = skill.description || "";
  // 中文场景下建议更短，避免 SERP 里被截断。
  const description = rawDesc.length > 120 ? `${rawDesc.slice(0, 120)}...` : rawDesc;
  const title = `${skill.name} - Skill Hub 中国`;

  const siteUrl = getSiteUrl();
  const canonicalPath = `/skill/${skillId}`;
  const absoluteUrl = new URL(canonicalPath, siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      type: "article",
      siteName: "Skill Hub 中国",
      images: [{ url: "/og-cover.png", alt: "Skill Hub 中国" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  /**
   * 详情页同样需要区分移动端 View：
   * - mobile：使用移动端专属布局（信息纵向排布 + 关联实践两列无限滚动）
   * - tablet/desktop：保持现有桌面详情页逻辑
   */
  const ua = headers().get("user-agent") || "";
  const deviceKind = detectDeviceKindFromUA(ua);

  const skillId = Number(params.id);
  if (Number.isNaN(skillId)) {
    notFound();
  }

  const skill = await fetchSkillDetail(skillId);
  if (!skill) {
    notFound();
  }

  return <DetailPage id={params.id} deviceKind={deviceKind} initialSkill={skill} />;
}
