import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, Eye, Tag, User } from "lucide-react";
import BodyClass from "@/components/BodyClass";
import { formatCompactNumber, formatDate } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 实践详情页 ISR 缓存：
 * - 每 120 秒重新生成
 * - 与 Skill 详情页保持同一刷新节奏，兼顾 SEO 稳定性与更新时效
 */
export const revalidate = 120;

type PracticeDetailRow = {
  id: number;
  title: string;
  summary: string;
  channel: string;
  source_url: string;
  author_name: string | null;
  updated_at: string;
  is_listed: boolean;
  click_count: number;
  skill_ids: number[] | null;
  primary_skill_id: number | null;
};

type SkillCardRow = {
  id: number;
  name: string;
  description: string | null;
  tag: string | null;
};

type RelatedPracticeRow = {
  id: number;
  title: string;
  summary: string;
  channel: string;
  author_name: string | null;
  updated_at: string;
  click_count: number;
};

type PracticeDetailPayload = {
  practice: PracticeDetailRow;
  relatedSkills: SkillCardRow[];
  relatedPractices: RelatedPracticeRow[];
  anchorSkillId: number | null;
};

/**
 * 详情页实践卡片强调色：
 * - 与 Skill 详情页中的实践卡片配色保持一致
 * - 只通过 CSS 变量驱动，不引入额外样式文件
 */
const PRACTICE_ACCENTS = [
  "rgba(255,107,0,0.98)",
  "rgba(255,204,0,0.95)",
  "rgba(255,168,0,0.90)",
];

/**
 * SEO 描述生成：
 * - 优先使用数据库摘要
 * - 控制长度，避免 description 过长导致摘要截断质量下降
 */
function buildPracticeDescription(summary: string): string {
  const normalized = (summary || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Skill Hub 中国实践案例详情页，包含来源、作者与关联 Skill。";
  }
  return normalized.length > 120 ? `${normalized.slice(0, 120)}...` : normalized;
}

/**
 * JSON-LD 序列化：
 * - 将 `<` 转义，避免被浏览器误识别为 HTML 标签
 */
function toJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * 组装“有序且去重”的 skill id 列表：
 * - primary_skill_id 优先，确保“主 Skill”语义稳定
 * - 其余按 skill_ids 原始顺序补齐
 */
function buildOrderedSkillIds(practice: Pick<PracticeDetailRow, "primary_skill_id" | "skill_ids">): number[] {
  const ordered: number[] = [];
  const seen = new Set<number>();

  const push = (value: number | string | null | undefined) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0 || seen.has(num)) {
      return;
    }
    ordered.push(num);
    seen.add(num);
  };

  push(practice.primary_skill_id);
  for (const id of Array.isArray(practice.skill_ids) ? practice.skill_ids : []) {
    push(id);
  }

  return ordered;
}

/**
 * 实践详情数据获取（服务端）：
 * - 用 cache 包装，复用 generateMetadata 与 Page 的数据库请求
 * - 严格只返回 is_listed=true，避免未上架内容被索引
 */
const fetchPracticeDetail = cache(async (id: number): Promise<PracticeDetailPayload | null> => {
  const supabase = getSupabaseServerClient();

  const { data: practiceRaw, error: practiceError } = await supabase
    .from("practices")
    .select("id, title, summary, channel, source_url, author_name, updated_at, is_listed, click_count, skill_ids, primary_skill_id")
    .eq("id", id)
    .eq("is_listed", true)
    .single();

  if (practiceError || !practiceRaw) {
    return null;
  }

  const practice = practiceRaw as PracticeDetailRow;
  let orderedSkillIds = buildOrderedSkillIds(practice);

  /**
   * 兜底策略：
   * - 若 practices.skill_ids 为空，回退到 practice_skills 关系表
   * - 这样能兼容历史数据或触发器延迟导致的短暂空值
   */
  if (orderedSkillIds.length === 0) {
    const { data: relationRows } = await supabase
      .from("practice_skills")
      .select("skill_id")
      .eq("practice_id", id);

    const fallbackIds = (relationRows || [])
      .map((row) => Number((row as { skill_id: number | string | null }).skill_id))
      .filter((skillId) => Number.isFinite(skillId) && skillId > 0);

    orderedSkillIds = Array.from(new Set(fallbackIds));
  }

  let relatedSkills: SkillCardRow[] = [];
  if (orderedSkillIds.length > 0) {
    const { data: skillsRaw } = await supabase
      .from("skills")
      .select("id, name, description, tag")
      .eq("is_listed", true)
      .in("id", orderedSkillIds);

    const skillMap = new Map<number, SkillCardRow>();
    for (const row of (skillsRaw || []) as SkillCardRow[]) {
      if (!row?.id) continue;
      skillMap.set(row.id, row);
    }

    // 保持 primary -> 其余 的展示顺序，避免 in 查询带来的顺序漂移。
    relatedSkills = orderedSkillIds.map((skillId) => skillMap.get(skillId)).filter(Boolean) as SkillCardRow[];
  }

  /**
   * 相关实践锚点 Skill 选择：
   * - 优先 primary_skill_id（若存在且可用）
   * - 否则回退到第一个关联 skill id
   */
  const anchorSkillId = orderedSkillIds.includes(Number(practice.primary_skill_id))
    ? Number(practice.primary_skill_id)
    : orderedSkillIds[0] || null;

  let relatedPractices: RelatedPracticeRow[] = [];
  if (anchorSkillId) {
    const { data: relatedRaw } = await supabase
      .from("practices")
      .select("id, title, summary, channel, author_name, updated_at, click_count")
      .eq("is_listed", true)
      .neq("id", id)
      .overlaps("skill_ids", [anchorSkillId])
      .order("updated_at", { ascending: false })
      .order("click_count", { ascending: false })
      .limit(6);

    relatedPractices = (relatedRaw || []) as RelatedPracticeRow[];
  }

  return {
    practice,
    relatedSkills,
    relatedPractices,
    anchorSkillId,
  };
});

/**
 * 实践详情页 Metadata：
 * - 动态 title / description / canonical / OG
 * - 详情不存在或未上架时返回 404
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const practiceId = Number(params.id);
  if (Number.isNaN(practiceId)) {
    notFound();
  }

  const payload = await fetchPracticeDetail(practiceId);
  if (!payload) {
    notFound();
  }

  const { practice } = payload;
  const siteUrl = getSiteUrl();
  const canonicalPath = `/practice/${practiceId}`;
  const absoluteUrl = new URL(canonicalPath, siteUrl).toString();
  const description = buildPracticeDescription(practice.summary);
  const title = `${practice.title} | Skill Hub 中国`;

  return {
    // 使用 absolute，避免根布局 template 再次拼接站点名导致重复。
    title: {
      absolute: title,
    },
    description,
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
      modifiedTime: practice.updated_at || undefined,
      images: [{ url: "/og-cover.png", alt: practice.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-cover.png"],
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const practiceId = Number(params.id);
  if (Number.isNaN(practiceId)) {
    notFound();
  }

  const payload = await fetchPracticeDetail(practiceId);
  if (!payload) {
    notFound();
  }

  const { practice, relatedSkills, relatedPractices, anchorSkillId } = payload;
  const siteUrl = getSiteUrl();
  const siteOrigin = siteUrl.toString().replace(/\/$/, "");
  const canonicalPath = `/practice/${practiceId}`;
  const absoluteUrl = new URL(canonicalPath, siteUrl).toString();
  const description = buildPracticeDescription(practice.summary);

  const authorName = (practice.author_name || "").trim() || "匿名作者";
  const channelName = (practice.channel || "").trim() || "-";
  const sourceUrl = (practice.source_url || "").trim();
  const summaryText = (practice.summary || "").replace(/\s+/g, " ").trim() || "暂无摘要";

  /**
   * Article Schema：
   * - 将实践详情页标记为 Article，补齐 headline/description/author/date 等字段
   * - 与 canonical URL 保持一致，避免结构化数据与页面 URL 漂移
   */
  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: practice.title,
    description,
    url: absoluteUrl,
    inLanguage: "zh-CN",
    datePublished: practice.updated_at || undefined,
    dateModified: practice.updated_at || undefined,
    author: practice.author_name
      ? {
          "@type": "Person",
          name: practice.author_name,
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
    ...(relatedSkills.length > 0 && {
      about: relatedSkills.map((skill) => ({
        "@type": "Thing",
        name: skill.name,
      })),
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
        name: practice.title,
        item: absoluteUrl,
      },
    ],
  };

  return (
    <>
      <BodyClass className="is-detail" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }} />

      <section className="hero hero--detail" aria-labelledby="practice-title">
        <div className="hero__bg" aria-hidden="true"></div>
        <div className="hero__inner hero__inner--detail">
          <div className="hero-copy hero-copy--detail">
            <div className="detail-hero__title-row">
              <h1 id="practice-title" className="detail-hero__title">
                <span className="hero-copy__brand hero-copy__brand--skill">{practice.title}</span>
              </h1>

              {anchorSkillId && relatedSkills[0] ? (
                <span className="tag detail-hero__tag" aria-label={`主关联 Skill ${relatedSkills[0].name}`}>
                  <Tag className="icon" aria-hidden="true" />
                  {relatedSkills[0].name}
                </span>
              ) : null}
            </div>

            <p className="detail-hero__subtitle">{summaryText}</p>

            <div className="detail-hero__stats" aria-label="实践元信息">
              <span className="stat" aria-label={`作者 ${authorName}`}>
                <User className="icon" aria-hidden="true" />
                <span className="stat__label">作者</span>
                <span className="stat__value">{authorName}</span>
              </span>
              <span className="stat" aria-label={`来源渠道 ${channelName}`}>
                <Tag className="icon" aria-hidden="true" />
                <span className="stat__label">来源</span>
                <span className="stat__value">{channelName}</span>
              </span>
              <span className="stat stat--empty" aria-label={`更新时间 ${formatDate(practice.updated_at)}`}>
                <CalendarDays className="icon" aria-hidden="true" />
                <span className="stat__label">Update</span>
                <span className="stat__value">{formatDate(practice.updated_at)}</span>
              </span>
              <span className="stat" aria-label={`阅读量 ${formatCompactNumber(practice.click_count)}`}>
                <Eye className="icon" aria-hidden="true" />
                <span className="stat__label">阅读</span>
                <span className="stat__value">{formatCompactNumber(practice.click_count)}</span>
              </span>
            </div>

            <div className="detail-hero__facts" aria-label="快捷导航">
              <Link className="hero-fact hero-fact--link" href="/" aria-label="返回首页">
                <span className="hero-fact__dot" aria-hidden="true" />
                返回首页
                <ExternalLink className="icon" aria-hidden="true" />
              </Link>
              {anchorSkillId && relatedSkills[0] ? (
                <Link
                  className="hero-fact hero-fact--link"
                  href={`/skill/${relatedSkills[0].id}`}
                  aria-label={`查看关联 Skill：${relatedSkills[0].name}`}
                >
                  <span className="hero-fact__dot" aria-hidden="true" />
                  关联 Skill：{relatedSkills[0].name}
                  <ExternalLink className="icon" aria-hidden="true" />
                </Link>
              ) : (
                <span className="hero-fact" aria-label="暂无主关联 Skill">
                  <span className="hero-fact__dot" aria-hidden="true" />
                  暂无主关联 Skill
                </span>
              )}
            </div>
          </div>

          <aside className="detail-panel" aria-label="原文入口">
            <div className="detail-panel__repo" aria-label="作者与来源">
              <span className="detail-panel__repo-avatar" aria-hidden="true"></span>
              <div className="detail-panel__repo-main">
                <div className="detail-panel__repo-name">{authorName}</div>
                <span className="detail-panel__repo-short">
                  <Tag className="icon" aria-hidden="true" />
                  {channelName}
                </span>
              </div>
            </div>

            <div className="detail-panel__header">
              <div className="detail-panel__title">阅读入口</div>
              <div className="detail-panel__hint">点击按钮跳转原文（新窗口打开）</div>
            </div>

            <div className="detail-panel__actions">
              <div className="detail-panel__download">
                <a
                  className="btn btn--primary detail-panel__download-btn"
                  href={sourceUrl || "#"}
                  target={sourceUrl ? "_blank" : undefined}
                  rel={sourceUrl ? "noreferrer noopener" : undefined}
                  aria-disabled={!sourceUrl}
                  aria-label="Read Original（新窗口）"
                >
                  <ExternalLink className="icon" aria-hidden="true" />
                  <span className="btn__label">Read Original</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <main className="page page--detail">
        <section className="detail-switch" aria-label="关联内容切换">
          <input className="detail-switch__radio" type="radio" name="detail-view" id="view-practices" defaultChecked />
          <input className="detail-switch__radio" type="radio" name="detail-view" id="view-skillmd" />

          <div className="detail-switch__header">
            <div className="detail-switch__left">
              <div className="detail-switch__tabs" aria-label="查看内容">
                <label className="detail-switch__tab" htmlFor="view-practices">
                  相关实践
                  <span className="detail-switch__count">{formatCompactNumber(relatedPractices.length)}</span>
                </label>
                <label className="detail-switch__tab" htmlFor="view-skillmd">
                  关联 Skill
                  <span className="detail-switch__count">{formatCompactNumber(relatedSkills.length)}</span>
                </label>
                <span className="detail-switch__indicator" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="detail-switch__panels">
            <section className="detail-tabpanel detail-tabpanel--practices practice-section" aria-label="相关实践">
              <header className="section-header">
                <h2>相关实践</h2>
              </header>

              {relatedPractices.length > 0 ? (
                <div className="practice-grid">
                  {relatedPractices.map((item, index) => {
                    const itemAuthorName = (item.author_name || "").trim() || "匿名作者";
                    const itemChannelName = (item.channel || "").trim() || "-";
                    const itemSourceText =
                      itemChannelName && itemAuthorName !== "匿名作者"
                        ? `${itemChannelName}·${itemAuthorName}`
                        : itemChannelName || itemAuthorName;
                    const itemSummary = (item.summary || "").replace(/\s+/g, " ").trim() || "暂无摘要";
                    const accent = PRACTICE_ACCENTS[index % PRACTICE_ACCENTS.length];

                    return (
                      <Link
                        key={item.id}
                        href={`/practice/${item.id}`}
                        className="practice-card"
                        aria-label={`查看实践：${item.title}`}
                        style={{ "--accent": accent } as CSSProperties}
                      >
                        <div className="practice-card__top">
                          <span className="practice-card__channel">{itemChannelName}</span>
                          <span className="stat stat--empty" aria-label={`更新时间 ${formatDate(item.updated_at)}`}>
                            <CalendarDays className="icon" aria-hidden="true" />
                            {formatDate(item.updated_at)}
                          </span>
                        </div>

                        <h3>{item.title}</h3>
                        <p>{itemSummary}</p>

                        <div className="practice-card__bottom">
                          <span className="meta" aria-label={`阅读量 ${formatCompactNumber(item.click_count)}`}>
                            <Eye className="icon" aria-hidden="true" />
                            {formatCompactNumber(item.click_count)}
                          </span>
                          <span className="meta" aria-label={`来源 ${itemSourceText}`} title={itemSourceText}>
                            <User className="icon" aria-hidden="true" />
                            {itemSourceText}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">当前主关联 Skill 下暂无其他已上架实践。</div>
              )}
            </section>

            <section className="detail-card detail-tabpanel detail-tabpanel--skillmd" aria-label="关联 Skill">
              <header className="section-header">
                <h2>关联 Skill</h2>
              </header>

              {relatedSkills.length > 0 ? (
                <div className="detail-related__grid">
                  {relatedSkills.map((skill) => (
                    <Link
                      key={skill.id}
                      href={`/skill/${skill.id}`}
                      className="detail-related__card"
                      aria-label={`查看 Skill：${skill.name}`}
                    >
                      <span className="detail-related__name">{skill.name}</span>
                      <span className="detail-related__desc">
                        {skill.description
                          ? skill.description.slice(0, 80) + (skill.description.length > 80 ? "..." : "")
                          : skill.tag || "暂无描述"}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-state">当前实践暂未关联已上架 Skill。</div>
              )}
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
