"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumberWithCommas } from "@/lib/format";
import type { BoardEntry, BoardTabKey, HomeMetrics } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

const ITEMS_PER_PAGE = 3;

/**
 * 把一维列表切成固定页大小，用于轮播分页。
 * ------------------------------------------------------------
 * 说明：
 * - 每页固定 3 条（产品硬约束）
 * - 数据不足时返回空数组，渲染层会做「加载骨架 / 空态」兜底
 */
function chunkEntries(entries: BoardEntry[], pageSize: number): BoardEntry[][] {
  if (!entries.length) {
    return [];
  }

  const pages: BoardEntry[][] = [];
  for (let i = 0; i < entries.length; i += pageSize) {
    pages.push(entries.slice(i, i + pageSize));
  }
  return pages;
}

/**
 * KPI 卡片配置：
 * - key 对应接口字段
 * - label/hint 对应视觉稿文案
 * - tone 用于卡片配色区分（但保持同一视觉系统）
 */
const KPI_CONFIG: Array<{
  key: "practice_total" | "practice_weekly_new" | "skill_featured_total" | "download_total";
  label: string;
  hint: string;
  toneClass: string;
}> = [
  {
    key: "practice_weekly_new",
    label: "本周上新",
    hint: "近 7 天更新",
    toneClass: "pc-retention-kpi--weekly",
  },
  {
    key: "practice_total",
    label: "案例数量",
    hint: "全站累计",
    toneClass: "pc-retention-kpi--cases",
  },
  {
    key: "skill_featured_total",
    label: "精选 Skill",
    hint: "精选/推荐",
    toneClass: "pc-retention-kpi--featured",
  },
  {
    key: "download_total",
    label: "下载总量",
    hint: "全站累计",
    toneClass: "pc-retention-kpi--downloads",
  },
];

const TAB_CONFIG: Array<{ key: BoardTabKey; label: string; analyticsTab: "weekly_featured" | "hot" }> = [
  { key: "weekly", label: "每周精选", analyticsTab: "weekly_featured" },
  { key: "hot", label: "热门榜单", analyticsTab: "hot" },
];

type KpiMetricKey = (typeof KPI_CONFIG)[number]["key"];
type KpiMetricMap = Record<KpiMetricKey, number | null>;

/**
 * 渲染 KPI 卡片右侧的装饰图形（纯视觉，不承载真实数据）。
 * ------------------------------------------------------------
 * 设计目的：
 * - 让「数据卡」不再显得空，视觉上更接近 mockup 的信息密度
 * - 图形全部使用静态 SVG，渲染稳定、性能开销低
 * - 仅作为语义弱装饰，统一 aria-hidden 避免读屏噪音
 */
function renderKpiDecoration(metricKey: KpiMetricKey): JSX.Element | null {
  switch (metricKey) {
    case "practice_total":
      return (
        <div className="pc-retention-kpi__viz pc-retention-kpi__viz--cases" aria-hidden="true">
          <svg viewBox="0 0 176 88" focusable="false">
            <line x1="24" y1="74" x2="168" y2="74" className="pc-retention-kpi__viz-axis" />
            <rect x="36" y="40" width="14" height="34" rx="7" className="pc-retention-kpi__viz-fill" />
            <rect x="58" y="28" width="14" height="46" rx="7" className="pc-retention-kpi__viz-fill" />
            <rect x="80" y="18" width="14" height="56" rx="7" className="pc-retention-kpi__viz-fill" />
            <rect x="102" y="30" width="14" height="44" rx="7" className="pc-retention-kpi__viz-fill" />
            <rect x="124" y="20" width="14" height="54" rx="7" className="pc-retention-kpi__viz-fill" />
            <rect x="146" y="8" width="14" height="66" rx="7" className="pc-retention-kpi__viz-fill" />
          </svg>
        </div>
      );

    case "practice_weekly_new":
      return (
        <div className="pc-retention-kpi__viz pc-retention-kpi__viz--weekly" aria-hidden="true">
          <svg viewBox="0 0 176 88" focusable="false">
            <line x1="22" y1="74" x2="166" y2="74" className="pc-retention-kpi__viz-axis" />
            <path
              d="M32 50C44 38 57 34 72 32C85 30 95 22 106 16C119 9 131 16 142 14C150 13 157 9 164 4"
              className="pc-retention-kpi__viz-stroke"
            />
            <circle cx="164" cy="4" r="7" className="pc-retention-kpi__viz-dot" />
          </svg>
        </div>
      );

    case "skill_featured_total":
      return (
        <div className="pc-retention-kpi__viz pc-retention-kpi__viz--featured" aria-hidden="true">
          <svg viewBox="0 0 176 88" focusable="false">
            <path d="M40 68A48 48 0 0 1 136 68" className="pc-retention-kpi__viz-track" />
            <path d="M40 68A48 48 0 0 1 116 28" className="pc-retention-kpi__viz-stroke" />
            <circle cx="88" cy="68" r="11" className="pc-retention-kpi__viz-dot" />
            <line x1="88" y1="68" x2="126" y2="40" className="pc-retention-kpi__viz-needle" />
          </svg>
        </div>
      );

    case "download_total":
      return (
        <div className="pc-retention-kpi__viz pc-retention-kpi__viz--downloads" aria-hidden="true">
          <svg viewBox="0 0 176 88" focusable="false">
            <line x1="24" y1="74" x2="166" y2="74" className="pc-retention-kpi__viz-axis" />
            <path
              d="M28 46C42 34 56 56 70 44C84 32 98 52 112 42C126 32 140 52 154 40C160 35 164 34 166 32"
              className="pc-retention-kpi__viz-stroke"
            />
            <path d="M134 14V46M134 46L122 34M134 46L146 34" className="pc-retention-kpi__viz-arrow" />
          </svg>
        </div>
      );

    default:
      return null;
  }
}

/**
 * 统一创建 KPI 显示映射，保证所有 key 始终存在，避免渲染期做大量空值分支。
 */
function createEmptyMetricMap(): KpiMetricMap {
  return {
    practice_total: null,
    practice_weekly_new: null,
    skill_featured_total: null,
    download_total: null,
  };
}

/**
 * 把接口值归一化为可动画的整数。
 * ------------------------------------------------------------
 * 规则：
 * - null / undefined / NaN / 负数 => null（渲染层会显示 `—`）
 * - 其余值统一四舍五入为整数，避免动画过程中出现小数抖动
 */
function normalizeMetricValue(value?: number | null): number | null {
  if (value === null || value === undefined) return null;

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;

  return Math.round(numeric);
}

/**
 * 把 HomeMetrics 转成渲染层使用的完整映射。
 */
function toKpiMetricMap(metrics: HomeMetrics | null): KpiMetricMap {
  return {
    practice_total: normalizeMetricValue(metrics?.practice_total),
    practice_weekly_new: normalizeMetricValue(metrics?.practice_weekly_new),
    skill_featured_total: normalizeMetricValue(metrics?.skill_featured_total),
    download_total: normalizeMetricValue(metrics?.download_total),
  };
}

/**
 * 比较两个 KPI 映射是否完全一致。
 * 说明：字段数量固定，用显式比较比 Object.keys 更直观且更稳定。
 */
function isSameMetricMap(left: KpiMetricMap, right: KpiMetricMap): boolean {
  return (
    left.practice_total === right.practice_total &&
    left.practice_weekly_new === right.practice_weekly_new &&
    left.skill_featured_total === right.skill_featured_total &&
    left.download_total === right.download_total
  );
}

/**
 * 读取并订阅系统“减少动态效果”偏好：
 * - true：直接展示最终值，不执行数字递增动画
 * - false：执行 requestAnimationFrame 动画
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    // Safari 旧版本兼容：addListener/removeListener 已弃用，但仍有存量用户。
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return prefersReducedMotion;
}

type HomeRetentionBannerProps = {
  metrics: HomeMetrics | null;
  metricsLoading?: boolean;
  weeklyEntries: BoardEntry[];
  weeklyLoading?: boolean;
  hotEntries: BoardEntry[];
  hotLoading?: boolean;
  /**
   * KPI 点击回调：
   * - 交由父组件处理路由切换/筛选逻辑
   * - Banner 只负责派发被点击的 KPI key，保持组件职责单一
   */
  onKpiClick?: (key: KpiMetricKey) => void;
};

function HomeRetentionBanner({
  metrics,
  metricsLoading = false,
  weeklyEntries,
  weeklyLoading = false,
  hotEntries,
  hotLoading = false,
  onKpiClick,
}: HomeRetentionBannerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeTab, setActiveTab] = useState<BoardTabKey>("weekly");
  // 每个 Tab 独立维护当前页码，切换 Tab 后不强制回到第一页。
  const [pageByTab, setPageByTab] = useState<Record<BoardTabKey, number>>({
    weekly: 0,
    hot: 0,
  });
  const targetMetricMap = useMemo(() => toKpiMetricMap(metrics), [metrics]);
  /**
   * 关键：支持 KPI 文本在 SSR HTML 中可见（SEO 友好）。
   * ------------------------------------------------------------
   * - 若首屏已拿到 metrics（metricsLoading=false），初始值直接落在目标值
   * - 若仍在 loading，继续沿用空映射，展示骨架
   *
   * 这样可以避免“服务端明明预取了数据，但 HTML 仍只有 `—`”的问题。
   */
  const [animatedMetricMap, setAnimatedMetricMap] = useState<KpiMetricMap>(() =>
    metricsLoading ? createEmptyMetricMap() : targetMetricMap
  );
  const animatedMetricMapRef = useRef<KpiMetricMap>(animatedMetricMap);

  const weeklyPages = useMemo(() => chunkEntries(weeklyEntries, ITEMS_PER_PAGE), [weeklyEntries]);
  const hotPages = useMemo(() => chunkEntries(hotEntries, ITEMS_PER_PAGE), [hotEntries]);

  const activePages = activeTab === "weekly" ? weeklyPages : hotPages;
  const isActiveTabLoading = activeTab === "weekly" ? weeklyLoading : hotLoading;
  const activeTabConfig = TAB_CONFIG.find((item) => item.key === activeTab) || TAB_CONFIG[0];

  // 空数据时仍保留 1 个 dot，避免控制区结构跳动。
  const activePageCount = Math.max(activePages.length, 1);
  const rawActivePageIndex = pageByTab[activeTab] ?? 0;
  const activePageIndex = Math.min(Math.max(rawActivePageIndex, 0), activePageCount - 1);

  /**
   * 数据变化后修正页码越界：
   * - 例如原来有 3 页，切换筛选后变成 1 页
   * - 若不修正会出现 transform 越界导致空白页
   */
  useEffect(() => {
    setPageByTab((prev) => {
      const weeklyMax = Math.max(weeklyPages.length - 1, 0);
      const hotMax = Math.max(hotPages.length - 1, 0);
      const next = {
        weekly: Math.min(prev.weekly ?? 0, weeklyMax),
        hot: Math.min(prev.hot ?? 0, hotMax),
      };

      if (next.weekly === prev.weekly && next.hot === prev.hot) {
        return prev;
      }
      return next;
    });
  }, [weeklyPages.length, hotPages.length]);

  /**
   * 用 ref 持有最新动画值，避免「动画 effect 依赖 state」导致每帧重启。
   */
  useEffect(() => {
    animatedMetricMapRef.current = animatedMetricMap;
  }, [animatedMetricMap]);

  /**
   * KPI 数字递增动画（字增）：
   * ------------------------------------------------------------
   * - 触发时机：接口加载完成后（metricsLoading=false）且有有效目标值
   * - 动画策略：requestAnimationFrame + easeOutCubic，时长约 1s
   * - 可访问性：prefers-reduced-motion 用户直接展示最终值
   */
  useEffect(() => {
    // 加载态展示骨架，不执行数字动画。
    if (metricsLoading) {
      return;
    }

    // 无动画偏好用户直接落最终值，避免动态干扰。
    if (prefersReducedMotion) {
      setAnimatedMetricMap((prev) => (isSameMetricMap(prev, targetMetricMap) ? prev : targetMetricMap));
      return;
    }

    const startMap = animatedMetricMapRef.current;
    const hasValueChanged = KPI_CONFIG.some((item) => startMap[item.key] !== targetMetricMap[item.key]);
    if (!hasValueChanged) {
      return;
    }

    const DURATION_MS = 1000;
    const startTime = performance.now();
    let rafId = 0;

    const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

    const tick = (now: number) => {
      const rawProgress = (now - startTime) / DURATION_MS;
      const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
      const easedProgress = easeOutCubic(clampedProgress);

      setAnimatedMetricMap((previous) => {
        const next: KpiMetricMap = { ...previous };

        KPI_CONFIG.forEach((item) => {
          const startValue = startMap[item.key];
          const endValue = targetMetricMap[item.key];

          // 目标不可用时直接回退占位值（`—`），不参与动画。
          if (endValue === null) {
            next[item.key] = null;
            return;
          }

          // null -> 数字 场景从 0 起步，符合用户对“递增”感知。
          const baseline = startValue === null ? 0 : startValue;
          next[item.key] = Math.round(baseline + (endValue - baseline) * easedProgress);
        });

        return next;
      });

      if (clampedProgress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [metricsLoading, prefersReducedMotion, targetMetricMap]);

  /**
   * 动态避让 fixed header，确保首行内容不被遮挡。
   * ------------------------------------------------------------
   * 设计要求：Banner 严格一屏，且标题不得被 Header 覆盖。
   */
  useEffect(() => {
    const header = document.querySelector(".app-header");
    if (!header) return;

    const root = document.documentElement;

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const update = () => {
      const rect = header.getBoundingClientRect();
      const safeTop = Math.ceil(rect.bottom + 22);
      const next = clamp(safeTop, 112, 220);
      root.style.setProperty("--pc-retention-padding-top", `${next}px`);
    };

    update();
    window.addEventListener("resize", update, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(header);
    }

    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, []);

  const switchTab = (tab: BoardTabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    const tabInfo = TAB_CONFIG.find((item) => item.key === tab) || TAB_CONFIG[0];
    trackEvent("home_board_tab_switch", {
      tab: tabInfo.analyticsTab,
    });
  };

  const navigatePage = (direction: "prev" | "next") => {
    if (activePageCount <= 1) return;

    setPageByTab((prev) => {
      const current = prev[activeTab] ?? 0;
      const delta = direction === "prev" ? -1 : 1;
      const nextIndex = (current + delta + activePageCount) % activePageCount;

      trackEvent("home_board_carousel_nav", {
        tab: activeTabConfig.analyticsTab,
        direction,
        // 使用 1-based 页码，便于业务侧直接阅读报表。
        to_index: nextIndex + 1,
      });

      return {
        ...prev,
        [activeTab]: nextIndex,
      };
    });
  };

  const onEntryClick = (entry: BoardEntry, indexInPage: number) => {
    const position = activePageIndex * ITEMS_PER_PAGE + indexInPage + 1;
    trackEvent("home_board_entry_click", {
      tab: activeTabConfig.analyticsTab,
      practice_id: entry.id,
      position,
    });

    // 点击统计为弱依赖：失败不影响跳转。
    fetch(`/api/practices/${entry.id}/click`, { method: "POST" }).catch(() => {
      // ignore
    });
  };

  const activeSlide = activePages[activePageIndex] || [];

  return (
    <section className="pc-retention-banner" aria-label="首页首屏更新看板（PC）">
      <div className="pc-retention-banner__inner">
        <div className="pc-retention-banner__layout">
          <section className="pc-retention-left" aria-label="品牌与关键数据">
            <div className="hero-copy hero-copy--minimal pc-retention-copy">
              <h1 className="hero-copy__title hero-copy__title--minimal" aria-label="站点名称与主标语">
                <span className="hero-copy__brand">Skill Hub 中国</span>
                <span className="hero-copy__slogan">
                  助力国内 Skill 使用者快速找到
                  <span className="hero-copy__slogan-emphasis">能用、好用、可复用</span>
                  的实践方案
                </span>
              </h1>
              <p className="hero__subtitle" aria-label="站点副说明">
                汇聚优质 Skill，打通真实场景，沉淀持续生产力
              </p>
            </div>

            <div className="pc-retention-kpi-grid" aria-label="关键数据展示（4项）">
              {KPI_CONFIG.map((item) => {
                const value = animatedMetricMap[item.key];
                const displayValue = formatNumberWithCommas(value);
                const canClick = !metricsLoading && typeof onKpiClick === "function";
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`pc-retention-kpi ${item.toneClass} ${metricsLoading ? "pc-retention-kpi--loading" : ""}`}
                    aria-label={item.label}
                    aria-busy={metricsLoading}
                    disabled={!canClick}
                    onClick={() => {
                      if (!canClick) return;
                      onKpiClick(item.key);
                    }}
                  >
                    {!metricsLoading ? renderKpiDecoration(item.key) : null}
                    <div className="pc-retention-kpi__content">
                      <div className="pc-retention-kpi__label">{item.label}</div>
                      {metricsLoading ? (
                        /**
                         * KPI 加载态（按视觉要求）：
                         * - 取消“条状骨架屏”
                         * - 改为卡片整体扫光动画（见 CSS 的 `pc-retention-kpi--loading::after`）
                         * - 这里仅保留占位高度，避免加载前后文案区跳动
                         */
                        <>
                          <div className="pc-retention-kpi__value pc-retention-kpi__value--loading" aria-hidden="true">
                            000,000
                          </div>
                          <div className="pc-retention-kpi__hint pc-retention-kpi__hint--loading" aria-hidden="true">
                            数据加载中
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="pc-retention-kpi__value">{displayValue}</div>
                          <div className="pc-retention-kpi__hint">{item.hint}</div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="pc-retention-right" aria-label="每周精选与热门榜单">
            <section className="pc-retention-board" aria-label="榜单模块">
              <div className="pc-retention-board__head">
                <div className="pc-retention-board__tabs" role="tablist" aria-label="榜单切换">
                  {TAB_CONFIG.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        className="pc-retention-board__tab"
                        data-active={isActive ? "true" : "false"}
                        aria-selected={isActive}
                        onClick={() => switchTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="pc-retention-board__controls" aria-label="轮播控制">
                  <div className="pc-retention-board__dots" aria-hidden="true">
                    {Array.from({ length: activePageCount }).map((_, idx) => (
                      <span
                        key={`dot-${activeTab}-${idx}`}
                        className="pc-retention-board__dot"
                        data-active={idx === activePageIndex ? "true" : "false"}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="pc-retention-board__nav"
                    aria-label="上一页"
                    onClick={() => navigatePage("prev")}
                    disabled={activePageCount <= 1}
                  >
                    <ChevronLeft className="icon" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="pc-retention-board__nav"
                    aria-label="下一页"
                    onClick={() => navigatePage("next")}
                    disabled={activePageCount <= 1}
                  >
                    <ChevronRight className="icon" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="pc-retention-board__viewport">
                {isActiveTabLoading && activeSlide.length === 0 ? (
                  <div className="pc-retention-board__slide" aria-label="榜单加载中">
                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                      <article key={`skeleton-${idx}`} className="pc-retention-entry pc-retention-entry--skeleton" aria-hidden="true">
                        <div className="pc-retention-entry__line pc-retention-entry__line--title" />
                        <div className="pc-retention-entry__line" />
                        <div className="pc-retention-entry__line pc-retention-entry__line--short" />
                      </article>
                    ))}
                  </div>
                ) : activeSlide.length > 0 ? (
                  <div className="pc-retention-board__track" style={{ transform: `translate3d(-${activePageIndex * 100}%, 0, 0)` }}>
                    {activePages.map((page, pageIndex) => (
                      <div key={`${activeTab}-page-${pageIndex}`} className="pc-retention-board__slide">
                        {page.map((entry, indexInPage) => {
                          const sourceText = entry.author_name
                            ? `来自 ${entry.channel} · ${entry.author_name}`
                            : `来自 ${entry.channel}`;
                          const skillName = entry.skill_name || "精选 Skill";
                          const hasUrl = Boolean(entry.source_url);
                          const normalizedSummary = (entry.summary || "").replace(/\\n/g, " ").trim();

                          return (
                            <a
                              key={entry.id}
                              className="pc-retention-entry-link"
                              href={hasUrl ? entry.source_url : "#"}
                              target={hasUrl ? "_blank" : undefined}
                              rel={hasUrl ? "noreferrer noopener" : undefined}
                              aria-disabled={!hasUrl}
                              onClick={(event) => {
                                if (!hasUrl) {
                                  event.preventDefault();
                                  return;
                                }
                                onEntryClick(entry, indexInPage);
                              }}
                            >
                              <article className="pc-retention-entry">
                                <h3 className="pc-retention-entry__title" title={entry.title}>
                                  {entry.title}
                                </h3>
                                <p className="pc-retention-entry__desc" title={normalizedSummary}>
                                  {normalizedSummary || "暂无摘要"}
                                </p>
                                <div className="pc-retention-entry__meta">
                                  <span className="pc-retention-entry__source">{sourceText}</span>
                                  <span className="pc-retention-entry__skill" title={skillName}>
                                    {skillName}
                                  </span>
                                </div>
                              </article>
                            </a>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pc-retention-board__slide">
                    <article className="pc-retention-entry pc-retention-entry--empty">
                      <p className="pc-retention-entry__empty-text">暂无可展示内容</p>
                    </article>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default memo(HomeRetentionBanner);
