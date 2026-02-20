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
 * 详情页 SEO 描述生成：
 * - 优先使用数据库 description（控制长度）
 * - description 缺失时，自动回退到“名称 + 场景 + 价值”的语义模板
 */
function buildSkillDescription(skill: Skill): string {
  const rawDesc = (skill.description || "").trim();
  if (rawDesc) {
    return rawDesc.length > 120 ? `${rawDesc.slice(0, 120)}...` : rawDesc;
  }

  const segments = [
    `${skill.name} 实战教程与落地方案`,
    "包含核心用法、场景实践与可复用步骤",
    "帮助你快速完成选型与上线",
  ];
  return segments.join("，");
}

/**
 * JSON-LD 序列化：
 * - 防止 `<` 被浏览器当作 HTML 标签起始符
 * - 保证结构化数据在 SSR HTML 中安全输出
 */
function toJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

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
    // SEO 只收录已上架内容：未上架 Skill 在详情页直接 404，避免被索引。
    .eq("is_listed", true)
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

  const description = buildSkillDescription(skill);
  /**
   * 这里不要手动拼接站点名：
   * - 根布局已配置 `template: "%s | Skill Hub 中国"`
   * - 仅传“页面主标题”可避免出现「站点名重复拼接」
   */
  const title = `${skill.name} 实战教程与可复用方案`;
  const keywords = [
    skill.name,
    `${skill.name} 教程`,
    `${skill.name} 实战`,
    skill.tag || "Skill",
    "Skill Hub 中国",
  ];

  const siteUrl = getSiteUrl();
  const canonicalPath = `/skill/${skillId}`;
  const absoluteUrl = new URL(canonicalPath, siteUrl).toString();
  const siteOrigin = siteUrl.toString().replace(/\/$/, "");

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      type: "article",
      siteName: "Skill Hub 中国",
      modifiedTime: skill.updated_at || undefined,
      images: [{ url: "/og-cover.png", alt: "Skill Hub 中国" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-cover.png"],
    },
    // 详情页与站点品牌的语义关联（补充实体归属）。
    authors: [{ name: "Skill Hub 中国", url: siteOrigin }],
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

  const siteUrl = getSiteUrl();
  const siteOrigin = siteUrl.toString().replace(/\/$/, "");
  const canonicalPath = `/skill/${skillId}`;
  const absoluteUrl = new URL(canonicalPath, siteUrl).toString();
  const description = buildSkillDescription(skill);

  /**
   * 结构化数据（详情页）：
   * 1) SoftwareApplication：描述当前 Skill 的核心属性、交互量与更新时间
   * 2) BreadcrumbList：补充层级路径，帮助搜索引擎理解信息结构
   */
  const softwareApplicationJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: skill.name,
    description,
    applicationCategory: skill.tag || "DeveloperApplication",
    operatingSystem: "Web",
    url: absoluteUrl,
    inLanguage: "zh-CN",
    dateModified: skill.updated_at || undefined,
    publisher: {
      "@type": "Organization",
      name: "Skill Hub 中国",
      url: siteOrigin,
    },
    // download_count 来自站内统计口径，作为交互热度信号补充。
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/DownloadAction",
      userInteractionCount: Number(skill.download_count) || 0,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首页",
        item: `${siteOrigin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: skill.name,
        item: absoluteUrl,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(softwareApplicationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <DetailPage id={params.id} deviceKind={deviceKind} initialSkill={skill} />
    </>
  );
}
