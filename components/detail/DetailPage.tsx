"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  CalendarDays,
  Download,
  Eye,
  Flame,
  Link2,
  Plus,
  Sparkles,
  Clock,
  Star,
  Tag,
  ExternalLink,
} from "lucide-react";

import BodyClass from "@/components/BodyClass";
import { SkillDetailSkeleton } from "@/components/SkillDetailSkeleton";
import { Skeleton } from "@/components/Skeleton";
import { Loading } from "@/components/Loading";
import { ISSUE_REPO_URL, PAGE_SIZE } from "@/lib/constants";
import { signInWithGitHub, useAuthUser } from "@/lib/auth";
import type { Paginated, Practice, Skill } from "@/lib/types";
import { formatCompactNumber, formatDate, formatHeat } from "@/lib/format";

/**
 * 解析 Markdown 顶部的 YAML Frontmatter，并将其转换为 Markdown 表格。
 * 目的：避免 `---` 被当作大标题/分割线渲染，导致视觉错乱。
 *
 * 规则（与 skillhub 版本保持一致，轻量解析）：
 * 1) 仅处理文档最顶部的 frontmatter（避免误伤正文中的 `---`）
 * 2) 只解析单行 `key: value` 形式（不做复杂 YAML 解析）
 * 3) 优先输出 name/description/license 三个字段；若缺失则输出所有字段
 */
const buildMarkdownForRender = (rawMarkdown: string): string => {
  // 兜底：空内容直接返回
  if (!rawMarkdown) {
    return "";
  }

  // 匹配文档开头的 frontmatter（允许 BOM 或空白）
  const frontmatterMatch = rawMarkdown.match(/^\ufeff?\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!frontmatterMatch) {
    return rawMarkdown;
  }

  const yamlText = frontmatterMatch[1] || "";
  const content = rawMarkdown.slice(frontmatterMatch[0].length);

  // 解析简单的 key: value（仅取第一个冒号左右）
  const frontmatter: Record<string, string> = {};
  yamlText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      // 忽略注释
      if (line.startsWith("#")) {
        return;
      }
      const colonIndex = line.indexOf(":");
      if (colonIndex <= 0) {
        return;
      }
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      if (!key) {
        return;
      }
      // 去掉最外层引号，减少显示噪音
      frontmatter[key] = value.replace(/^['"]|['"]$/g, "");
    });

  const preferredKeys = ["name", "description", "license"];
  const tableKeys = preferredKeys.filter((key) => frontmatter[key]);
  const keys = tableKeys.length ? tableKeys : Object.keys(frontmatter);

  if (!keys.length) {
    // frontmatter 为空时，直接移除 frontmatter，避免出现“超大标题”
    return content;
  }

  const escapeTableCell = (value: string): string => {
    // 避免表格里出现 `|` 或换行导致错位
    return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  };

  const headerRow = `| ${keys.join(" | ")} |`;
  const dividerRow = `| ${keys.map(() => "---").join(" | ")} |`;
  const valueRow = `| ${keys.map((key) => escapeTableCell(frontmatter[key] || "")).join(" | ")} |`;

  const tableMarkdown = [headerRow, dividerRow, valueRow].join("\n");
  const normalizedContent = content.replace(/^\r?\n+/, "");

  // 表格后需要空行，否则正文可能被解析成表格行
  return `${tableMarkdown}\n\n${normalizedContent}`.trim();
};

/**
 * PracticeCardSkeleton：
 * - 用于“实践列表加载中”的占位卡片
 * - 结构对齐真实 practice-card，避免加载完成后整体高度抖动
 */
const PracticeCardSkeleton = () => {
  return (
    <article className="practice-card" aria-hidden="true">
      {/* 顶部行：频道 + 日期 */}
      <div className="practice-card__top">
        <Skeleton width={90} height={16} variant="text" />
        <Skeleton width={110} height={16} variant="text" />
      </div>

      {/* 标题占位 */}
      <Skeleton width="70%" height={22} variant="text" style={{ marginTop: 6 }} />

      {/* 摘要占位：两行文本，模拟正文节奏 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <Skeleton width="100%" height={14} variant="text" />
        <Skeleton width="86%" height={14} variant="text" />
      </div>

      {/* 底部信息占位 */}
      <div className="practice-card__bottom">
        <Skeleton width={140} height={14} variant="text" />
        <Skeleton width={90} height={14} variant="text" />
      </div>
    </article>
  );
};

/**
 * 详情页「实践文章」卡片的强调色：
 * - 需求：与首页/全站“暖色（橙/黄）”基调保持一致，尽量避免过多粉色与绿色。
 * - 实现：用 CSS 自定义变量 `--accent` 驱动卡片内部的描边/高光（见 app/globals.css .practice-card）。
 * - 说明：这里按列表 index 轮换强调色即可，避免引入复杂的“按渠道映射”逻辑（视觉稿目的优先）。
 */
const PRACTICE_ACCENTS = [
  "rgba(255,107,0,0.98)", // warm orange
  "rgba(255,204,0,0.95)", // amber yellow
  "rgba(255,168,0,0.90)", // golden orange
];

export default function DetailPage({ id }: { id: string }) {
  const skillId = Number(id);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [skillLoading, setSkillLoading] = useState(true);
  const { user } = useAuthUser();
  // 按钮级别的请求状态，用于展示“正在处理”的过渡态。
  const [downloadPending, setDownloadPending] = useState(false);
  const [submitPracticePending, setSubmitPracticePending] = useState(false);

  const [practices, setPractices] = useState<Practice[]>([]);
  const [practicePage, setPracticePage] = useState(1);
  const [practiceTotalPages, setPracticeTotalPages] = useState(1);
  const [practiceLoading, setPracticeLoading] = useState(false);
  // 实践排序：参考首页“最热/最新”，热度按点击量，最新按更新时间。
  const [practiceSort, setPracticeSort] = useState<"heat" | "recent">("heat");

  // 对 Markdown 做一次预处理，避免每次渲染重复解析
  const renderedMarkdown = useMemo(() => buildMarkdownForRender(skill?.markdown || ""), [skill?.markdown]);

  // 解析 GitHub 仓库短地址（owner/repo），用于详情页右侧信息展示。
  const getRepoShort = (url?: string | null) => {
    if (!url) return "-";
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
    } catch {
      // ignore：非标准 URL 时走降级处理
    }
    const trimmed = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    const fallbackParts = trimmed.split("/").filter(Boolean);
    if (fallbackParts.length >= 2) {
      return `${fallbackParts[0]}/${fallbackParts[1]}`;
    }
    return trimmed || "-";
  };

  const repoShort = useMemo(() => getRepoShort(skill?.source_url), [skill?.source_url]);

  const practicesQuery = useMemo(() => {
    const search = new URLSearchParams();
    search.set("page", String(practicePage));
    search.set("size", String(PAGE_SIZE));
    search.set("sort", practiceSort);
    return search.toString();
  }, [practicePage, practiceSort]);

  useEffect(() => {
    let cancelled = false;
    const fetchSkill = async () => {
      setSkillLoading(true);
      try {
        // 第一次请求走“快路径”：只拿缓存，保证页面立即可见。
        const res = await fetch(`/api/skills/${skillId}?refresh=0`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setSkill(json.data || null);
        }

        // 缓存返回后，异步触发刷新（不阻塞渲染）。
        // 这样用户先看到页面，再在后台更新 GitHub 最新数据。
        const refresh = async () => {
          try {
            const refreshRes = await fetch(`/api/skills/${skillId}?refresh=1`, { cache: "no-store" });
            const refreshJson = await refreshRes.json();
            if (!cancelled && refreshJson?.data) {
              setSkill(refreshJson.data);
            }
          } catch {
            // ignore：刷新失败不影响当前展示
          }
        };
        refresh();
      } catch {
        if (!cancelled) setSkill(null);
      } finally {
        if (!cancelled) setSkillLoading(false);
      }
    };
    if (!Number.isNaN(skillId)) fetchSkill();
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  useEffect(() => {
    let cancelled = false;
    const fetchPractices = async () => {
      setPracticeLoading(true);
      try {
        const res = await fetch(`/api/skills/${skillId}/practices?${practicesQuery}`, {
          cache: "no-store",
        });
        const json: Paginated<Practice> = await res.json();
        if (!cancelled) {
          setPractices(json.data || []);
          setPracticeTotalPages(json.totalPages || 1);
        }
      } catch {
        if (!cancelled) {
          setPractices([]);
          setPracticeTotalPages(1);
        }
      } finally {
        if (!cancelled) setPracticeLoading(false);
      }
    };
    if (!Number.isNaN(skillId)) fetchPractices();
    return () => {
      cancelled = true;
    };
  }, [skillId, practicesQuery]);

  const handleDownload = async () => {
    if (!skill || downloadPending) return;
    setDownloadPending(true);
    try {
      await fetch(`/api/skills/${skill.id}/download-count`, { method: "POST" });
    } catch {
      // ignore
    }
    // 设置短暂延迟，避免下载触发但按钮立刻恢复导致“像是没反应”。
    window.setTimeout(() => setDownloadPending(false), 2000);
    window.location.href = `/api/skills/${skill.id}/download`;
  };

  // 切换实践排序时回到第一页，避免页码越界造成空列表。
  const handlePracticeSortChange = (next: "heat" | "recent") => {
    setPracticeSort(next);
    setPracticePage(1);
  };

  /**
   * 实践卡片点击统计：
   * - 跳转由 `<a target="_blank">` 的默认行为完成，避免 JS 打开窗口带来的兼容性/拦截问题。
   * - 统计请求不 `await`：避免阻塞浏览器打开新窗口/新标签页（体感会更“跟手”）。
   */
  const handlePracticeClick = (practice: Practice) => {
    fetch(`/api/practices/${practice.id}/click`, { method: "POST" }).catch(() => {
      // ignore：统计失败不影响用户继续阅读实践文章
    });
  };

  const handleSubmitPractice = async () => {
    if (user) {
      window.open(ISSUE_REPO_URL, "_blank", "noreferrer");
      return;
    }
    setSubmitPracticePending(true);
    try {
      await signInWithGitHub(ISSUE_REPO_URL);
    } finally {
      setSubmitPracticePending(false);
    }
  };

  // 详情页首屏加载：优先渲染骨架屏，避免空白页 + 文案闪烁。
  if (skillLoading) {
    return (
      <>
        <BodyClass className="is-detail" />
        <SkillDetailSkeleton />
      </>
    );
  }

  return (
    <>
      <BodyClass className="is-detail" />
      <section className="hero hero--detail" aria-labelledby="detail-title">
        <div className="hero__bg" aria-hidden="true">
          <span className="glow glow--pink"></span>
          <span className="glow glow--orange"></span>
          <span className="glow glow--yellow"></span>
          <span className="spark spark--one"></span>
          <span className="spark spark--two"></span>
          <span className="spark spark--three"></span>
        </div>

        <div className="hero__inner hero__inner--detail">
          <div className="hero-copy hero-copy--detail">
            <div className="detail-hero__title-row">
              <h1 id="detail-title" className="detail-hero__title">
                <span className="hero-copy__brand hero-copy__brand--skill">
                  {skillLoading ? "加载中..." : skill?.name || "未找到"}
                </span>
              </h1>
              <span className="tag detail-hero__tag">
                <Tag className="icon" />
                {skill?.tag || "-"}
              </span>
            </div>
            <p className="detail-hero__subtitle">{skill?.description || ""}</p>

            <div className="detail-hero__stats" aria-label="热度与仓库指标">
              <span className="stat stat--heat" aria-label={`热度 ${formatHeat(skill?.heat_score)}`}>
                <Flame className="icon" />
                <span className="stat__label">热度</span>
                <span className="stat__value">{formatHeat(skill?.heat_score)}</span>
              </span>
              <span className="stat" aria-label={`Stars ${formatCompactNumber(skill?.repo_stars || 0)}`}>
                <Star className="icon" />
                <span className="stat__label">Star</span>
                <span className="stat__value">{formatCompactNumber(skill?.repo_stars || 0)}</span>
              </span>
              <span className="stat stat--empty" aria-label={`更新时间 ${formatDate(skill?.updated_at)}`}>
                <CalendarDays className="icon" />
                <span className="stat__label">Update</span>
                <span className="stat__value">{formatDate(skill?.updated_at)}</span>
              </span>
            </div>
          </div>

          <aside className="detail-panel" aria-label="操作区">
            <a
              className="detail-panel__repo detail-panel__repo--link"
              href={skill?.source_url || "#"}
              target="_blank"
              rel="noreferrer"
              aria-label="打开仓库"
            >
              {skill?.repo_owner_avatar_url ? (
                <img
                  className="detail-panel__repo-avatar"
                  src={skill.repo_owner_avatar_url}
                  alt={skill?.repo_owner_name || "GitHub"}
                />
              ) : (
                <span className="detail-panel__repo-avatar" aria-hidden="true"></span>
              )}
              <div className="detail-panel__repo-main">
                <div className="detail-panel__repo-name">{skill?.repo_owner_name || "-"}</div>
                <span className="detail-panel__repo-short">
                  <Link2 className="icon" />
                  {repoShort}
                </span>
              </div>
            </a>

            <div className="detail-panel__actions">
              {/* 下载按钮增加扫光轮播特效与独立 hover 逻辑，保持视觉强调但不再上浮 */}
              <button
                className="btn btn--primary btn--download"
                type="button"
                onClick={handleDownload}
                disabled={downloadPending}
                data-loading={downloadPending}
                aria-busy={downloadPending}
              >
                <Download className="icon" />
                <span className="btn__label">下载 SKILL 包</span>
                <span className="btn__loading" aria-hidden="true">
                  <Loading variant="dots" sizePx={14} />
                </span>
              </button>
            </div>
          </aside>
        </div>
      </section>

      <main className="page page--detail">
        <section className="detail-switch" aria-label="内容切换">
          <input className="detail-switch__radio" type="radio" name="detail-view" id="view-practices" defaultChecked />
          <input className="detail-switch__radio" type="radio" name="detail-view" id="view-skillmd" />

          {/* Tab 左侧；实践列表上方新增投稿引导条，右侧为实践排序（最热/最新） */}
          <div className="detail-switch__header">
            <div className="detail-switch__left">
              <div className="detail-switch__tabs" aria-label="查看内容">
                <label className="detail-switch__tab" htmlFor="view-practices">
                  热门实践
                  <span className="detail-switch__count">{formatCompactNumber(skill?.practice_count ?? 0)}</span>
                </label>
                <label className="detail-switch__tab" htmlFor="view-skillmd">
                  SKILL.md
                </label>
                <span className="detail-switch__indicator" aria-hidden="true" />
              </div>
            </div>

            <div className="detail-switch__right" aria-label="实践排序">
              <div className="sort-switch sort-switch--practice" role="group" aria-label="实践排序">
                <div className="sort-switch__seg" data-active={practiceSort}>
                  <button
                    className={`sort-switch__btn ${practiceSort === "heat" ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={practiceSort === "heat"}
                    onClick={() => handlePracticeSortChange("heat")}
                    data-loading={practiceLoading && practiceSort === "heat"}
                    aria-busy={practiceLoading && practiceSort === "heat"}
                    disabled={practiceLoading}
                  >
                    <Flame className="icon" />
                    最热
                  </button>
                  <button
                    className={`sort-switch__btn ${practiceSort === "recent" ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={practiceSort === "recent"}
                    onClick={() => handlePracticeSortChange("recent")}
                    data-loading={practiceLoading && practiceSort === "recent"}
                    aria-busy={practiceLoading && practiceSort === "recent"}
                    disabled={practiceLoading}
                  >
                    <Clock className="icon" />
                    最新
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-switch__panels">
            {/* 实践区不再包一层大容器（detail-card），与 mockup/detail.html 保持一致：卡片直接“铺在背景上”更轻盈。 */}
            <section className="detail-tabpanel detail-tabpanel--practices practice-section" aria-label="实践列表">
              {/* 投稿引导条：整条可点击，引导“先浏览、再投稿”的行为路径 */}
              <button
                className="practice-cta practice-cta--interactive"
                type="button"
                onClick={handleSubmitPractice}
                disabled={submitPracticePending}
                aria-busy={submitPracticePending}
                aria-label="投稿引导，点击开始投稿"
              >
                {/* 光晕扫过层：仅作为视觉装饰，不承载交互 */}
                <span className="practice-cta__sweep" aria-hidden="true" />
                <div className="practice-cta__content">
                  <h3 className="practice-cta__title">
                    {/* 标题前的装饰图标：保留“投稿主题”，避免误判为可点击入口 */}
                    <Sparkles className="icon" aria-hidden="true" />
                    分享你的实践，让更多人看见你的方案
                  </h3>
                  <p className="practice-cta__desc">提交后会进入实践展示流程，与社区一起沉淀高质量案例。</p>
                </div>
                {/* CTA 视觉胶囊：仅视觉呈现，真正点击由整条引导条承担 */}
                <span className="practice-cta__cta" data-loading={submitPracticePending}>
                  <Plus className="icon" aria-hidden="true" />
                  <span className="practice-cta__cta-text">立即投稿</span>
                  <span className="practice-cta__cta-loading" aria-hidden="true">
                    <Loading variant="dots" sizePx={12} />
                  </span>
                </span>
              </button>
              {practiceLoading ? (
                // 实践列表加载中：使用骨架卡片占位，保持网格高度稳定。
                <div className="practice-grid" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <PracticeCardSkeleton key={`practice-skeleton-${index}`} />
                  ))}
                </div>
              ) : practices.length === 0 ? (
                <div className="empty-state">暂无实践</div>
              ) : (
                <div className="practice-grid">
                  {practices.map((practice, index) => {
                    const accent = PRACTICE_ACCENTS[index % PRACTICE_ACCENTS.length];
                    return (
                      <a
                        key={practice.id}
                        className="practice-card"
                        href={practice.source_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handlePracticeClick(practice)}
                        aria-label={`打开实践：${practice.title}（新窗口）`}
                        style={{ "--accent": accent } as CSSProperties}
                      >
                        <div className="practice-card__top">
                          <span className="practice-card__channel">{practice.channel}</span>
                          <span className="stat stat--empty" aria-label={`更新时间 ${formatDate(practice.updated_at)}`}>
                            <CalendarDays className="icon" />
                            {formatDate(practice.updated_at)}
                          </span>
                        </div>
                        <h3>{practice.title}</h3>
                        <p>{practice.summary}</p>
                        <div className="practice-card__bottom">
                          <span className="meta" aria-label={`点击 ${formatCompactNumber(practice.click_count)}`}>
                            <Eye className="icon" />{formatCompactNumber(practice.click_count)}
                          </span>
                          <span className="meta" aria-hidden="true">
                            <Link2 className="icon" />
                            查看原文
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              <nav className="pagination" aria-label="实践分页">
                <button
                  className="page-btn"
                  type="button"
                  disabled={practicePage <= 1 || practiceLoading}
                  onClick={() => setPracticePage(Math.max(practicePage - 1, 1))}
                  aria-label="上一页"
                >
                  ‹
                </button>
                {Array.from({ length: practiceTotalPages }, (_, i) => i + 1)
                  .slice(0, 10)
                  .map((p) => (
                    <button
                      key={p}
                      className={`page-btn ${p === practicePage ? "is-active" : ""}`}
                      type="button"
                      onClick={() => setPracticePage(p)}
                      disabled={practiceLoading}
                      data-loading={practiceLoading && p === practicePage}
                      aria-busy={practiceLoading && p === practicePage}
                    >
                      {p}
                    </button>
                  ))}
                <button
                  className="page-btn"
                  type="button"
                  disabled={practicePage >= practiceTotalPages || practiceLoading}
                  onClick={() => setPracticePage(Math.min(practicePage + 1, practiceTotalPages))}
                  aria-label="下一页"
                >
                  ›
                </button>
              </nav>
            </section>

            <section className="detail-card detail-tabpanel detail-tabpanel--skillmd" aria-label="SKILL.md 内容区">
              <header className="section-header">
                <h2>SKILL.md</h2>
                <a className="btn btn--ghost btn--sm" href={skill?.source_url || "#"} target="_blank" rel="noreferrer">
                  前往 Source
                </a>
              </header>

              <article className="markdown">
                {!skill?.markdown ? (
                  <p>未找到 SKILL.md</p>
                ) : skill.markdown_render_mode === "plain" ? (
                  <pre>{skill.markdown}</pre>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {renderedMarkdown}
                  </ReactMarkdown>
                )}
              </article>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
