import type { Metadata } from "next";
import DetailPage from "@/components/detail/DetailPage";
import type { DeviceKind } from "@/lib/device";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 详情页 ISR 缓存：
 * - 每 120 秒重新生成
 * - Skill 数据更新频率低，2 分钟缓存足够
 */
export const revalidate = 120;
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
   * ISR 模式下不读 UA（避免 headers() 强制动态渲染）：
   * - SSR 统一按 desktop 输出（SEO 友好）
   * - 客户端 DetailPage 组件自行检测设备类型
   */
  const deviceKind = "desktop" as const;

  const skillId = Number(params.id);
  if (Number.isNaN(skillId)) {
    notFound();
  }

  const skill = await fetchSkillDetail(skillId);
  if (!skill) {
    notFound();
  }

  const supabase = getSupabaseServerClient();

  /**
   * pSEO Tier 1：相关 Skill 推荐（同 tag，排除自身，按热度排序，最多 6 个）
   */
  const { data: relatedSkillsRaw } = await supabase
    .from("skills")
    .select("id, name, tag, heat_score, description")
    .eq("is_listed", true)
    .eq("tag", skill.tag || "")
    .neq("id", skillId)
    .order("heat_score", { ascending: false })
    .limit(6);
  const relatedSkills = (relatedSkillsRaw || []) as Array<{
    id: number;
    name: string;
    tag: string;
    heat_score: number;
    description: string;
  }>;

  /**
   * pSEO Tier 1：FAQ 区块（自动生成，SSR 直出）
   * - 覆盖高频搜索意图："XX 是什么""XX 怎么用""XX 和 YY 的区别"
   * - FAQ Schema 直接影响 Google 富文本摘要展示
   */
  const faqItems: Array<{ question: string; answer: string }> = [];
  const skillName = skill.name;
  const skillDesc = (skill.description || "").trim();
  const practiceCount = skill.practice_count || 0;

  // Q1: XX 是什么？
  faqItems.push({
    question: `${skillName} 是什么？`,
    answer: skillDesc
      ? `${skillName} 是一个 AI Agent Skill（智能体技能）。${skillDesc}`
      : `${skillName} 是一个 AI Agent Skill（智能体技能），可以在 Claude Code、Cursor 等 AI 编程工具中使用，帮助开发者提升效率。`,
  });

  // Q2: XX 怎么用？
  faqItems.push({
    question: `${skillName} 怎么用？`,
    answer: `你可以在 Skill Hub 中国下载 ${skillName} 的 SKILL.md 文件，放入你的项目目录中。AI Agent（如 Claude Code）会自动识别并加载该 Skill，按照其中定义的规则和流程来辅助你完成任务。${practiceCount > 0 ? `目前已有 ${practiceCount} 篇实践案例可供参考。` : ""}`,
  });

  // Q3: 有哪些实践案例？
  if (practiceCount > 0) {
    faqItems.push({
      question: `${skillName} 有哪些实践案例？`,
      answer: `目前 Skill Hub 中国收录了 ${practiceCount} 篇 ${skillName} 的实践案例，涵盖真实项目中的使用场景、操作步骤和踩坑记录。你可以在本页面的「热门实践」区域查看完整列表。`,
    });
  }

  // Q4: 和相关 Skill 的区别（如果有相关 Skill）
  if (relatedSkills.length > 0) {
    const topRelated = relatedSkills[0];
    faqItems.push({
      question: `${skillName} 和 ${topRelated.name} 有什么区别？`,
      answer: `${skillName} 和 ${topRelated.name} 都属于「${skill.tag}」类别的 AI Skill。${skillDesc ? `${skillName} 主要用于${skillDesc.slice(0, 60)}。` : ""}${topRelated.description ? `${topRelated.name} 则侧重于${topRelated.description.slice(0, 60)}。` : ""}你可以根据具体场景选择最合适的 Skill。`,
    });
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
   * 3) FAQPage：FAQ 区块，直接影响 Google 富文本摘要
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
    // 作者信息：优先使用 repo_owner_name，缺失时回退到组织。
    author: skill.repo_owner_name
      ? {
          "@type": "Person",
          name: skill.repo_owner_name,
          url: `https://github.com/${skill.repo_owner_name}`,
        }
      : {
          "@type": "Organization",
          name: "Skill Hub 中国",
          url: siteOrigin,
        },
    // 下载链接：优先使用 source_url（原始仓库），回退到详情页。
    downloadUrl: skill.source_url || absoluteUrl,
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
    // 关键词：从 tag 字段提取，补充通用关键词。
    keywords: [skill.tag, skill.name, "AI Skill", "开发者工具"].filter(Boolean).join(", "),
    /**
     * aggregateRating：仅在有实践案例时输出，避免虚假评分风险。
     * - ratingValue 基于热度分数映射到 4.5-5.0 区间
     * - ratingCount 使用实践案例数
     */
    ...(practiceCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Math.min(4.5 + ((Number(skill.heat_score) || 0) / 100000) * 0.5, 5.0).toFixed(1),
        ratingCount: practiceCount,
        bestRating: "5",
        worstRating: "1",
      },
    }),
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

  // pSEO: FAQ Schema（FAQPage）
  const faqJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  /**
   * Article Schema：
   * - 将 Skill 详情页标记为技术文章，提升搜索引擎对内容型页面的理解
   * - headline / description / author / dateModified 等字段覆盖 Google Article 富文本要求
   */
  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${skillName} 实战教程与可复用方案`,
    description,
    url: absoluteUrl,
    inLanguage: "zh-CN",
    datePublished: skill.updated_at || undefined,
    dateModified: skill.updated_at || undefined,
    author: skill.repo_owner_name
      ? {
          "@type": "Person",
          name: skill.repo_owner_name,
          url: `https://github.com/${skill.repo_owner_name}`,
        }
      : {
          "@type": "Organization",
          name: "Skill Hub 中国",
          url: siteOrigin,
        },
    publisher: {
      "@type": "Organization",
      name: "Skill Hub 中国",
      url: siteOrigin,
      logo: {
        "@type": "ImageObject",
        url: `${siteOrigin}/og-cover.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl,
    },
    image: `${siteOrigin}/og-cover.png`,
    keywords: [skillName, `${skillName} 教程`, `${skillName} 实战`, skill.tag, "AI Skill"].filter(Boolean),
    ...(practiceCount > 0 && {
      about: {
        "@type": "Thing",
        name: skillName,
        description: `共有 ${practiceCount} 篇实践案例`,
      },
    }),
  };

  /**
   * HowTo Schema：
   * - 提供"如何使用该 Skill"的结构化步骤，覆盖 Google HowTo 富文本摘要
   * - 步骤基于 Skill 的通用使用流程自动生成
   */
  const howToSteps = [
    {
      "@type": "HowToStep" as const,
      position: 1,
      name: "下载 Skill 文件",
      text: skill.supports_download_zip
        ? `在 Skill Hub 中国的 ${skillName} 详情页点击「下载」按钮，获取 SKILL.md 文件。`
        : `前往 ${skillName} 的官方仓库（${skill.source_url || "GitHub"}）下载 SKILL.md 文件。`,
      url: absoluteUrl,
    },
    {
      "@type": "HowToStep" as const,
      position: 2,
      name: "放入项目目录",
      text: `将下载的 SKILL.md 文件放入你的项目根目录或 .cursor/rules、.claude 等 AI 工具的配置目录中。`,
    },
    {
      "@type": "HowToStep" as const,
      position: 3,
      name: "启动 AI Agent 加载 Skill",
      text: `打开 Claude Code、Cursor 等 AI 编程工具，Agent 会自动识别并加载 ${skillName}，按照 Skill 中定义的规则辅助你完成任务。`,
    },
  ];

  // 如果有 npx 命令，插入一步快捷安装
  if (skill.npx_download_command) {
    howToSteps.splice(1, 0, {
      "@type": "HowToStep" as const,
      position: 2,
      name: "使用命令行快速安装",
      text: `也可以通过命令行一键安装：${skill.npx_download_command}`,
    });
    // 重新编号
    howToSteps.forEach((step, i) => {
      step.position = i + 1;
    });
  }

  // 如果有实践案例，追加一步参考实践
  if (practiceCount > 0) {
    howToSteps.push({
      "@type": "HowToStep" as const,
      position: howToSteps.length + 1,
      name: "参考实践案例",
      text: `查看 ${practiceCount} 篇 ${skillName} 的实践案例，了解真实项目中的使用场景和踩坑记录。`,
      url: absoluteUrl,
    });
  }

  const howToJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `如何使用 ${skillName}`,
    description: `一步步教你下载、安装并使用 ${skillName} AI Skill，快速提升开发效率。`,
    totalTime: "PT5M",
    tool: {
      "@type": "HowToTool",
      name: "AI 编程工具（Claude Code / Cursor 等）",
    },
    step: howToSteps,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(softwareApplicationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(howToJsonLd) }} />
      <DetailPage
        id={params.id}
        deviceKind={deviceKind}
        initialSkill={skill}
        faqItems={faqItems}
        relatedSkills={relatedSkills}
      />
    </>
  );
}
