"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Autoplay, Pagination as SwiperPagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  CalendarDays,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  LayoutGrid,
  Newspaper,
  RefreshCcw,
  X,
} from "lucide-react";

import { PAGE_SIZE, SORT_OPTIONS, TAG_OPTIONS } from "@/lib/constants";
import type { Practice, PracticeWithSkills, Skill } from "@/lib/types";
import { formatCompactNumber, formatDate, formatHeat } from "@/lib/format";
import type { HomeMode } from "@/components/home/ModeDock";

/**
 * HomeMobileView
 * ------------------------------------------------------------
 * v1.2.0（Mobile Web）首页移动端视图：
 * - Hero：横向轮播（第 1 张品牌卡 + 推荐实践卡）
 * - Toolbar：吸顶 sticky，分类 Chip 横滑 + 排序切换 + ids 锁定集合 Chip（仅 skills 模式）
 * - 列表：两列网格 + 无限滚动（触底加载）
 * - 实践模式：点击卡片弹 ActionSheet（替代 hover），卡片本体不直接跳转
 * - 浮层：底部模式切换条（随滚动显隐）+ 回到顶部按钮
 *
 * 注意：
 * - 该组件只负责“移动端展示与交互”，不直接发请求
 * - 数据请求、URL 同步、筛选规则（2A + Chip）由容器层 HomePage 统一处理
 */

type ListState<T> = {
  items: T[];
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  totalPages: number;
};

/**
 * Mobile Skeleton 卡片（Home）
 * ------------------------------------------------------------
 * 需求口径（对齐 docs/1.2.0_mobile/mockup）：
 * - 首屏加载用“卡片骨架”占位，避免页面太空
 * - 两列网格下用 4 张（两行）更接近真实首屏节奏
 * - 动效仅用 opacity（见 app/mobile.css 的 m-skeleton-pulse），性能更稳
 */
function MobileSkillCardSkeleton({ index }: { index: number }) {
  // 轻微错峰：避免 4 张卡同频闪烁，视觉更高级
  const delay = `${index * 90}ms`;

  return (
    <div className="m-card m-card--skill m-card--skeleton" aria-hidden="true">
      <div className="m-skeleton-block m-skeleton-line m-skeleton-line--title" style={{ animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "92%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "86%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "78%", animationDelay: delay }} />

      <div className="m-skeleton-row">
        <div className="m-skeleton-block m-skeleton-line m-skeleton-line--meta" style={{ width: "46%", animationDelay: delay }} />
        <div className="m-skeleton-block m-skeleton-line m-skeleton-line--meta" style={{ width: "38%", animationDelay: delay }} />
      </div>
    </div>
  );
}

function MobilePracticeCardSkeleton({ index }: { index: number }) {
  const delay = `${index * 90}ms`;

  return (
    <div className="m-card m-card--practice m-card--skeleton" aria-hidden="true">
      {/* 标题（两行） */}
      <div className="m-skeleton-block m-skeleton-line" style={{ height: 16, width: "78%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ height: 16, width: "56%", animationDelay: delay }} />

      {/* 摘要（多行，模拟真实密度） */}
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "96%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "90%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "84%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "88%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "76%", animationDelay: delay }} />

      {/* Footer（作者/阅读） */}
      <div className="m-skeleton-row">
        <div className="m-skeleton-block m-skeleton-line m-skeleton-line--meta" style={{ width: "46%", animationDelay: delay }} />
        <div className="m-skeleton-block m-skeleton-line m-skeleton-line--meta" style={{ width: "32%", animationDelay: delay }} />
      </div>
    </div>
  );
}

function MobileHeroCardSkeleton() {
  /**
   * Hero 轮播骨架屏：
   * - 解决“轮播区域空一大块，看起来像坏了”的问题
   * - 结构用几条文本行模拟：品牌字 + 大标题 + 描述 + 底部 meta
   * - 动效复用 app/mobile.css 的 m-skeleton-pulse（仅 opacity），性能更稳
   */
  const delay = "0ms";

  return (
    <div className="m-hero-card m-hero-card--skeleton" aria-hidden="true">
      {/* 品牌字占位 */}
      <div className="m-skeleton-block m-skeleton-line" style={{ height: 22, width: "46%", animationDelay: delay }} />

      {/* 标题（两行） */}
      <div className="m-skeleton-block m-skeleton-line" style={{ height: 18, width: "92%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ height: 18, width: "76%", animationDelay: delay }} />

      {/* 描述（两行） */}
      <div className="m-skeleton-block m-skeleton-line" style={{ height: 14, width: "84%", animationDelay: delay }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ height: 14, width: "70%", animationDelay: delay }} />

      {/* 底部 meta（左右两段） */}
      <div className="m-skeleton-row" style={{ marginTop: "auto" }}>
        <div className="m-skeleton-block m-skeleton-line m-skeleton-line--meta" style={{ width: "38%", animationDelay: delay }} />
        <div className="m-skeleton-block m-skeleton-line m-skeleton-line--meta" style={{ width: "28%", animationDelay: delay }} />
      </div>
    </div>
  );
}

export type HomeMobileViewProps = {
  mode: HomeMode;
  tag: string;
  sort: string;
  page: number;

  featured: Practice[];
  featuredLoading: boolean;

  skills: ListState<Skill>;
  practices: ListState<PracticeWithSkills>;

  idsCount: number;

  onModeChange: (mode: HomeMode) => void;
  onTagChange: (tag: string) => void;
  onSortChange: (sort: string) => void;
  onClearIds: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onFilterSkillsByIds: (skillIds: number[]) => void;
};

function mergeIdsFromPractice(practice: PracticeWithSkills): number[] {
  /**
   * 关联 Skill ID 的来源优先级：
   * - 优先 practices.skill_ids（多对多的“真实关系”）
   * - fallback：skills[].id（接口已返回轻量技能信息）
   *
   * 这里做一次：
   * - number 化
   * - 非法过滤
   * - 去重（保持插入顺序）
   */
  const normalized = (Array.isArray(practice.skill_ids) ? practice.skill_ids : [])
    .map((id) => (typeof id === "string" ? Number(id) : id))
    .filter((id) => Number.isFinite(id) && Number(id) > 0)
    .map((id) => Number(id));

  const fallback = (practice.skills || [])
    .map((skill) => skill.id)
    .filter((id) => Number.isFinite(id) && Number(id) > 0);

  const unique = new Set<number>(normalized.length > 0 ? normalized : fallback);
  return Array.from(unique);
}

function PracticeSheet({
  open,
  practice,
  onClose,
  onOpenOriginal,
  onFilterSkills,
}: {
  open: boolean;
  practice: PracticeWithSkills | null;
  onClose: () => void;
  onOpenOriginal: (practice: PracticeWithSkills) => void;
  onFilterSkills: (practice: PracticeWithSkills) => void;
}) {
  /**
   * 打开/关闭时锁住背景滚动：
   * - 移动端 Bottom Sheet 常见痛点：遮罩打开后背景仍能滚动，造成“晕动感”
   * - 这里用 body class 配合 CSS 处理（见 app/mobile.css）
   */
  useEffect(() => {
    if (!open) {
      document.body.classList.remove("is-sheet-open");
      return;
    }
    document.body.classList.add("is-sheet-open");
    return () => document.body.classList.remove("is-sheet-open");
  }, [open]);

  /**
   * 关闭动效说明：
   * - 为了让 Bottom Sheet “收起”有过渡，我们不能在 open=false 时立刻 unmount
   * - 因此这里的渲染条件只依赖 practice 是否存在：
   *   - practice=null：不渲染（完全卸载）
   *   - practice!=null：始终渲染，但用 data-open 控制“显隐与动画”
   *
   * 对应逻辑在父组件：
   * - closeSheet()：先 setOpen(false) 触发动画
   * - 再 setTimeout 清空 practice，让组件真正卸载
   */
  if (!practice) {
    return null;
  }

  const title = practice.title || "-";
  const summary = (practice.summary || "").replace(/\\n/g, "\n").trim();
  const channel = practice.channel?.trim();
  const author = practice.author_name?.trim();
  const sourceText = channel && author ? `${channel}·${author}` : channel || author || "-";

  const relatedSkills = (practice.skills || []).map((item) => item?.name).filter(Boolean) as string[];

  return (
    <div
      className="sheet"
      aria-label="实践操作面板"
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      data-open={open ? "true" : "false"}
    >
      <div
        className="sheet__backdrop"
        aria-hidden="true"
        onClick={() => {
          // 只有打开态才响应关闭，避免“动画中误点”导致状态错乱。
          if (open) {
            onClose();
          }
        }}
      />

      <div className="sheet__panel" role="document">
        <div className="sheet__grab" aria-hidden="true" />

        <div className="sheet__info" aria-label="文章信息">
          <h3 className="sheet__title">{title}</h3>
          <div className="sheet__source">{sourceText}</div>
          <p className="sheet__summary">{summary}</p>

          <div className="sheet__meta" aria-label="补齐信息">
            <span>
              <CalendarDays className="icon" aria-hidden="true" /> {formatDate(practice.updated_at)}
            </span>
            <span>
              <Eye className="icon" aria-hidden="true" /> {formatCompactNumber(practice.click_count)}
            </span>
          </div>

          {relatedSkills.length > 0 ? (
            <div className="sheet__skills" aria-label="关联技能（横向滚动）">
              {relatedSkills.map((name) => (
                <span key={name} className="tag" title={name}>
                  {name}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="sheet__actions" aria-label="操作按钮">
          <button
            className="sheet-btn sheet-btn--primary"
            type="button"
            onClick={() => onOpenOriginal(practice)}
            aria-label="跳转原文"
          >
            <span className="sheet-btn__icon" aria-hidden="true">
              <ExternalLink className="icon" />
            </span>
            跳转原文
          </button>
          <button className="sheet-btn" type="button" onClick={() => onFilterSkills(practice)} aria-label="筛选相关 Skill">
            <span className="sheet-btn__icon" aria-hidden="true">
              <Filter className="icon" />
            </span>
            筛选相关 Skill
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeBarMobile({
  mode,
  onChange,
}: {
  mode: HomeMode;
  onChange: (mode: HomeMode) => void;
}) {
  /**
   * 底部模式切换条（Mobile）
   * ------------------------------------------------------------
   * 交互口径：
   * - 向下滚动：隐藏（减少遮挡）
   * - 向上滚动 / 停止滚动：出现
   *
   * 实现：
   * - 监听 scroll 方向；向下时隐藏，向上时显示
   * - 同时加“停止滚动”定时器：用户停住后自动出现（避免一直隐藏导致找不到入口）
   */
  const [visible, setVisible] = useState(true);
  const lastYRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  useEffect(() => {
    lastYRef.current = window.scrollY || 0;

    const onScroll = () => {
      if (rafRef.current) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const nextY = window.scrollY || 0;
        const prevY = lastYRef.current;
        const delta = nextY - prevY;

        // 小幅抖动（例如 iOS 回弹）不触发显隐，避免 UI 抖动。
        if (Math.abs(delta) >= 10) {
          if (delta > 0) {
            setVisible(false);
          } else {
            setVisible(true);
          }
        }

        lastYRef.current = nextY;

        // “停止滚动”兜底：一段时间没滚动后自动显示。
        clearIdleTimer();
        idleTimerRef.current = window.setTimeout(() => {
          setVisible(true);
          idleTimerRef.current = null;
        }, 260);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearIdleTimer();
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div className="m-mode-switch" data-visible={visible ? "true" : "false"} aria-label="模式切换">
      <div className="m-seg" role="tablist" aria-label="首页模式">
        <button
          className={`m-seg__btn ${mode === "skills" ? "is-active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "skills"}
          onClick={() => onChange("skills")}
        >
          <span className="m-seg__icon" aria-hidden="true">
            <LayoutGrid className="icon" />
          </span>
          Skills
        </button>
        <button
          className={`m-seg__btn ${mode === "practices" ? "is-active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "practices"}
          onClick={() => onChange("practices")}
        >
          <span className="m-seg__icon" aria-hidden="true">
            <Newspaper className="icon" />
          </span>
          实践
        </button>
      </div>
    </div>
  );
}

function ToTopButton() {
  /**
   * 回到顶部按钮（Mobile）
   * ------------------------------------------------------------
   * 需求口径：
   * - 下滑超过 1~2 屏后出现
   * - 点击后平滑回到顶部
   */
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const y = window.scrollY || 0;
        setVisible(y > 720);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <button
      className="m-to-top"
      type="button"
      aria-label="回到顶部"
      data-visible={visible ? "true" : "false"}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ChevronUp className="icon" aria-hidden="true" />
    </button>
  );
}

export default function HomeMobileView(props: HomeMobileViewProps) {
  const {
    mode,
    tag,
    sort,
    page,
    featured,
    featuredLoading,
    skills,
    practices,
    idsCount,
    onModeChange,
    onTagChange,
    onSortChange,
    onClearIds,
    onLoadMore,
    onRetry,
    onFilterSkillsByIds,
  } = props;

  const current = mode === "skills" ? skills : practices;

  // 是否还有下一页：用于无限滚动判定。
  const hasMore = page < (current.totalPages || 1);
  // 首屏/刷新加载：显示 skeleton（而不是继续展示旧列表，避免“筛选已切换但列表还是旧数据”的错觉）。
  const showFirstPageSkeleton = !current.hasLoaded || (current.loading && page === 1);
  // 加载更多：保留已渲染列表，仅在底部展示“加载中”反馈。
  const loadingMore = current.loading && page > 1;

  // ActionSheet：仅在实践模式下使用。
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPractice, setSheetPractice] = useState<PracticeWithSkills | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // 防止 IntersectionObserver 在“同一帧/同一滚动段”内重复触发导致 page 连续 +2/+3。
  const loadMoreLockedRef = useRef(false);

  useEffect(() => {
    // 每次请求完成（loading=false）后解锁，允许下一次触底加载。
    if (!current.loading) {
      loadMoreLockedRef.current = false;
    }
  }, [current.loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasMore) return;
    if (current.loading) return;
    if (current.error) return;

    /**
     * IntersectionObserver 触底加载：
     * - rootMargin 提前触发（接近底部就预取），减少用户“看到空白再加载”的顿挫感
     * - threshold=0：只要进入视口即可
     */
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        // 关键保护：避免重复触发导致 page 连续递增。
        if (loadMoreLockedRef.current) return;
        loadMoreLockedRef.current = true;
        onLoadMore();
      },
      { rootMargin: "600px 0px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, current.loading, current.error, onLoadMore]);

  /**
   * Hero 轮播的 slides：
   * - 第 1 张：品牌卡（强调“Skill Hub 中国”）
   * - 其余：推荐实践卡
   */
  const heroSlides = useMemo(() => {
    const deck: Array<{ type: "brand" } | { type: "practice"; practice: Practice }> = [{ type: "brand" }];
    for (const p of featured || []) {
      deck.push({ type: "practice", practice: p });
    }
    return deck;
  }, [featured]);

  const openSheetForPractice = (practice: PracticeWithSkills) => {
    setSheetPractice(practice);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    // 关闭动画结束后再清空数据，避免面板内容“闪一下”。
    window.setTimeout(() => setSheetPractice(null), 240);
  };

  const trackClick = (practiceId: number) => {
    fetch(`/api/practices/${practiceId}/click`, { method: "POST" }).catch(() => {
      // ignore：统计失败不影响用户阅读
    });
  };

  const handleOpenOriginal = (practice: PracticeWithSkills) => {
    if (!practice.source_url) return;
    // 关闭面板，避免“打开新页面后面板还停留在当前页面”的割裂感。
    closeSheet();
    trackClick(practice.id);
    window.open(practice.source_url, "_blank", "noopener,noreferrer");
  };

  const handleFilterSkills = (practice: PracticeWithSkills) => {
    const ids = mergeIdsFromPractice(practice);
    if (ids.length === 0) return;
    closeSheet();
    onFilterSkillsByIds(ids);
  };

  const activeSortLabel = SORT_OPTIONS.find((item) => item.value === sort)?.label || "最热";

  return (
    <>
      <main className="m-safe" role="main" aria-label="移动端首页内容">
        {/* Hero：移动端横向轮播 */}
        <section className="m-hero" aria-label="移动端 Hero 轮播" aria-busy={featuredLoading}>
          <Swiper
            className="m-hero__swiper"
            modules={[Autoplay, SwiperPagination]}
            /*
              轮播卡片“露出下一张”的视觉（对齐 mockup）：
              - slidesPerView=auto：由 CSS 控制每张 slide 的宽度（见 app/mobile.css）
              - 这样可以做到：当前卡片完整可读，同时右侧露出下一张的一小段，形成“可滑动”暗示
            */
            slidesPerView="auto"
            spaceBetween={12}
            rewind
            speed={520}
            autoplay={
              heroSlides.length > 1
                ? {
                    delay: 3600,
                    disableOnInteraction: false,
                  }
                : false
            }
            pagination={{ clickable: true }}
          >
            {featuredLoading ? (
              /*
                轮播骨架屏需要“露出下一张”的节奏：
                - 当前视觉是 slidesPerView="auto" + 固定 slide 宽度，右侧会露出下一张的一小段
                - 如果只渲染 1 张 skeleton，右侧露出的区域会变成空白（用户反馈：红框处需要骨架）
                - 因此这里渲染 2 张 skeleton：第 2 张仅露出一部分，形成“仍在加载”的连贯感
              */
              <>
                <SwiperSlide key="hero-skeleton-0">
                  <MobileHeroCardSkeleton />
                </SwiperSlide>
                <SwiperSlide key="hero-skeleton-1">
                  <MobileHeroCardSkeleton />
                </SwiperSlide>
              </>
            ) : (
              heroSlides.map((item, index) => {
                if (item.type === "brand") {
                  return (
                    <SwiperSlide key="brand">
                      <div className="m-hero-card m-hero-card--brand" aria-label="品牌介绍">
                        <div className="m-hero-brand__badge">Skill Hub 中国</div>
                        <h2 className="m-hero-brand__headline">
                          连接优质 Skill 与场景落地，沉淀 <em>可复用</em> 的 AI 生产力模块
                        </h2>
                        <p className="m-hero-brand__desc">汇聚优质 Skill，打通真实场景，沉淀持续生产力</p>
                      </div>
                    </SwiperSlide>
                  );
                }

                const p = item.practice;
                const title = p.title || "-";
                const summary = (p.summary || "").replace(/\\n/g, "\n").replace(/\r?\n/g, " ").trim();
                const channel = p.channel?.trim();
                const author = p.author_name?.trim();
                const sourceText = channel && author ? `${channel}·${author}` : channel || author || "-";

                return (
                  <SwiperSlide key={`practice-${p.id}-${index}`}>
                    <a
                      className="m-hero-card m-hero-card--practice"
                      href={p.source_url || "#"}
                      target={p.source_url ? "_blank" : undefined}
                      rel={p.source_url ? "noreferrer noopener" : undefined}
                      aria-label={`打开推荐实践：${title}`}
                      onClick={(event) => {
                        if (!p.source_url) {
                          event.preventDefault();
                          return;
                        }
                        trackClick(p.id);
                      }}
                    >
                      <div className="m-hero-practice__title">{title}</div>
                      <div className="m-hero-practice__summary">{summary}</div>
                      <div className="m-hero-practice__meta" aria-label="来源与日期">
                        <span title={sourceText}>{sourceText}</span>
                        <span>{formatDate(p.updated_at)}</span>
                      </div>
                    </a>
                  </SwiperSlide>
                );
              })
            )}
          </Swiper>
        </section>

        {/* Toolbar：吸顶筛选条 */}
        <section className="m-toolbar" aria-label="筛选与排序" data-has-ids={mode === "skills" && idsCount > 0 ? "true" : "false"}>
          <div className="m-toolbar__row">
            <nav className="m-chips" aria-label="分类标签（横向可滚动）">
              {TAG_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`m-chip ${item === tag ? "is-active" : ""}`}
                  onClick={() => onTagChange(item)}
                  disabled={current.loading}
                  aria-pressed={item === tag}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="m-sort" role="group" aria-label="排序">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`m-sort__btn ${option.value === sort ? "is-active" : ""}`}
                  type="button"
                  aria-pressed={option.value === sort}
                  onClick={() => onSortChange(option.value)}
                  disabled={current.loading}
                  title={option.label}
                >
                  {option.value === "heat" ? <Flame className="icon" aria-hidden="true" /> : <Clock className="icon" aria-hidden="true" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* ids 锁定集合：仅 skills 模式显示 */}
          {mode === "skills" && idsCount > 0 ? (
            <div className="m-toolbar__subrow" aria-label="关联技能筛选提示">
              <button className="ids-chip" type="button" onClick={onClearIds} disabled={current.loading}>
                <Filter className="icon" aria-hidden="true" />
                <span className="ids-chip__text">关联技能（{idsCount}）</span>
                <X className="icon ids-chip__x" aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </section>

        {/* 列表：skills / practices */}
        {mode === "skills" ? (
          <section className="m-grid" aria-label="Skill 列表" aria-busy={current.loading}>
            {showFirstPageSkeleton ? (
              Array.from({ length: 4 }).map((_, index) => <MobileSkillCardSkeleton key={`m-skill-skeleton-${index}`} index={index} />)
            ) : current.error ? (
              <div className="m-feed-state" role="status" aria-label="加载失败">
                <div className="m-feed-state__title">加载失败</div>
                <div className="m-feed-state__desc">{current.error}</div>
                <button className="m-retry" type="button" onClick={onRetry} aria-label="重试加载">
                  <RefreshCcw className="icon" aria-hidden="true" />
                  重试
                </button>
              </div>
            ) : skills.items.length === 0 ? (
              <div className="m-feed-state" role="status" aria-label="暂无结果">
                <div className="m-feed-state__title">暂无匹配</div>
                <div className="m-feed-state__desc">试试切换分类或更换关键词。</div>
              </div>
            ) : (
              skills.items.map((skill) => (
                <Link key={skill.id} href={`/skill/${skill.id}`} className="m-card m-card--skill" aria-label={`查看 ${skill.name} 详情`}>
                  <div className="m-skill__title" title={skill.name}>
                    {skill.name}
                  </div>
                  <div className="m-skill__desc">{skill.description}</div>
                  <div className="m-skill__meta" aria-label="技能元信息">
                    <span className="m-skill__stat" title="热度">
                      <Flame className="icon" aria-hidden="true" />
                      {formatHeat(skill.heat_score)}
                    </span>
                    <span className="m-skill__stat" title="实践数">
                      <Newspaper className="icon" aria-hidden="true" />
                      {skill.practice_count}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </section>
        ) : (
          <section className="m-grid" aria-label="实践文章列表" aria-busy={current.loading}>
            {showFirstPageSkeleton ? (
              Array.from({ length: 4 }).map((_, index) => (
                <MobilePracticeCardSkeleton key={`m-practice-skeleton-${index}`} index={index} />
              ))
            ) : current.error ? (
              <div className="m-feed-state" role="status" aria-label="加载失败">
                <div className="m-feed-state__title">加载失败</div>
                <div className="m-feed-state__desc">{current.error}</div>
                <button className="m-retry" type="button" onClick={onRetry} aria-label="重试加载">
                  <RefreshCcw className="icon" aria-hidden="true" />
                  重试
                </button>
              </div>
            ) : practices.items.length === 0 ? (
              <div className="m-feed-state" role="status" aria-label="暂无文章">
                <div className="m-feed-state__title">暂无文章</div>
                <div className="m-feed-state__desc">试试切换分类或排序。</div>
              </div>
            ) : (
              practices.items.map((practice) => {
                const title = practice.title || "-";
                const summaryText = (practice.summary || "").replace(/\\n/g, "\n").replace(/\r?\n/g, " ").trim();
                const author = practice.author_name?.trim();
                // 需求：实践 mode 卡片作者处仅展示作者名（不展示渠道名）
                const sourceText = author || "-";

                return (
                  <button
                    key={practice.id}
                    type="button"
                    className="m-card m-card--practice"
                    aria-label={`查看实践操作：${title}`}
                    onClick={() => openSheetForPractice(practice)}
                  >
                    <div className="m-practice__title">{title}</div>
                    <div className="m-practice__summary" aria-label="文章简介（最多 5 行，末行渐隐）">
                      <span className="m-practice__summary-text">{summaryText}</span>
                    </div>
                    <div className="m-practice__meta" aria-label="文章元信息">
                      <span className="m-practice__author" title={sourceText}>
                        {sourceText}
                      </span>
                      <span className="m-practice__views" aria-label={`阅读量 ${formatCompactNumber(practice.click_count)}`}>
                        <Eye className="icon" aria-hidden="true" />
                        {formatCompactNumber(practice.click_count)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </section>
        )}

        {/* 无限滚动的触底哨兵 */}
        <div ref={sentinelRef} className="m-sentinel" aria-hidden="true" />

        {/* 列表底部状态（loading / error / end） */}
        <div className="m-feed-footer" aria-label="列表状态">
          {loadingMore ? (
            <div className="m-feed-footer__loading" aria-label="加载中">
              加载中…
            </div>
          ) : current.error ? (
            <button className="m-feed-footer__retry" type="button" onClick={onRetry} aria-label="重试加载">
              <RefreshCcw className="icon" aria-hidden="true" />
              重试
            </button>
          ) : !showFirstPageSkeleton && !hasMore && current.items.length > 0 ? (
            <div className="m-feed-footer__end" aria-label="已到底">
              已到底（{mode === "skills" ? `按“${activeSortLabel}”排序` : `按“${activeSortLabel}”排序`}）
            </div>
          ) : null}
        </div>
      </main>

      <ToTopButton />
      <ModeBarMobile mode={mode} onChange={onModeChange} />

      <PracticeSheet
        open={sheetOpen}
        practice={sheetPractice}
        onClose={closeSheet}
        onOpenOriginal={handleOpenOriginal}
        onFilterSkills={handleFilterSkills}
      />
    </>
  );
}
