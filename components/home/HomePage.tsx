"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SKILL_ISSUE_URL, TAG_OPTIONS, SORT_OPTIONS, PAGE_SIZE } from "@/lib/constants";
import type { Paginated, Practice, PracticeWithSkills, Skill } from "@/lib/types";
import type { DeviceKind } from "@/lib/device";
import SkillCard from "@/components/home/SkillCard";
import { SkillCardSkeleton } from "@/components/SkillCardSkeleton";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import Pagination from "@/components/home/Pagination";
import EmptyState from "@/components/EmptyState";
import ModeDock, { type HomeMode } from "@/components/home/ModeDock";
import PracticeFeedCard from "@/components/home/PracticeFeedCard";
import PracticeFeedCardSkeleton from "@/components/home/PracticeFeedCardSkeleton";
import { Clock, Filter, FilterX, Flame, Plus, RefreshCcw, SearchX, Sparkles, TriangleAlert, X } from "lucide-react";
import HomeMobileView from "@/components/home/mobile/HomeMobileView";

export type HomeInitialState = {
  q?: string;
  tag?: string;
  sort?: string;
  mode?: string;
  // ids=1,2,3：用于“从实践卡片筛选相关 Skill”场景（仅展示指定 Skill 列表）
  ids?: string;
};

export default function HomePage({
  initial,
  deviceKind = "desktop",
}: {
  initial: HomeInitialState;
  /**
   * 设备类型（来自 Server Component UA 判断）：
   * - mobile：渲染移动端专属 View（v1.2.0）
   * - tablet/desktop：本期统一按桌面 View 处理
   */
  deviceKind?: DeviceKind;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Next 的 usePathname 在部分类型版本下可能返回 null，这里统一兜底为首页根路径。
  const safePathname = pathname || "/";

  // 默认模式保持当前行为：刷 Skill；当 URL 带 mode=practices 时进入实践模式（可分享/刷新保持）。
  const initialMode: HomeMode = initial.mode === "practices" ? "practices" : "skills";
  const [mode, setMode] = useState<HomeMode>(initialMode);

  const [tag, setTag] = useState(initial.tag || "全部");
  /**
   * 排序默认值（小优化）：
   * - skills 模式：默认“最热”（heat）
   * - practices 模式：默认“最新”（recent）
   *
   * 注意：
   * - 如果 URL 明确带了 sort，则尊重 URL（例如用户主动切换到“最热”）
   * - 如果 URL 没带 sort，则使用各自模式的默认值，避免用户感觉“怎么默认不是最新”
   */
  const defaultSortForInitialMode = initialMode === "practices" ? "recent" : "heat";
  const [sort, setSort] = useState(initial.sort || defaultSortForInitialMode);
  const [query, setQuery] = useState(initial.q || "");
  // skills 列表的“指定 id 过滤”（例如从实践卡片点“筛选相关 Skill”进入）
  const [ids, setIds] = useState(initial.ids || "");
  const [page, setPage] = useState(1);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  // 首屏默认视为加载中，避免“先出现暂无 Skill 再闪回骨架”的视觉抖动。
  const [loading, setLoading] = useState(true);
  // 标记是否完成过至少一次请求，用于控制空状态的显示时机。
  const [hasLoaded, setHasLoaded] = useState(false);
  // skills 请求错误信息（移动端需要“失败重试”，桌面端也可复用该口径）。
  const [skillsError, setSkillsError] = useState<string | null>(null);
  // retry 触发器：递增即可强制重新请求（避免把 fetch 逻辑暴露到渲染层）。
  const [skillsReloadKey, setSkillsReloadKey] = useState(0);

  const [practices, setPractices] = useState<PracticeWithSkills[]>([]);
  const [practiceTotalPages, setPracticeTotalPages] = useState(1);
  // 实践模式加载态：与 skills 类似，首屏默认视为加载中，避免“空态闪现”。
  const [practiceLoading, setPracticeLoading] = useState(true);
  const [practiceHasLoaded, setPracticeHasLoaded] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  // retry 触发器：递增即可强制重新请求（避免把 fetch 逻辑暴露到渲染层）。
  const [practiceReloadKey, setPracticeReloadKey] = useState(0);

  const [featured, setFeatured] = useState<Practice[]>([]);
  // Hero 推荐卡片加载状态：用于触发“骨架 -> 渐隐 -> 入场”过渡。
  const [featuredLoading, setFeaturedLoading] = useState(true);

  /**
   * 解析 ids=1,2,3... 的数量（去重后），用于展示“关联技能筛选”Chip。
   * 说明：
   * - ids 由实践卡片“筛选相关 Skill”进入时写入 URL
   * - 该筛选属于“特殊上下文”，需要显式提示用户当前处于“锁定集合”状态
   */
  const idsCount = useMemo(() => {
    if (!ids) return 0;
    const parts = ids
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number(item))
      .filter((num) => Number.isFinite(num) && num > 0);
    return new Set(parts).size;
  }, [ids]);

  /**
   * 首页空状态（暂无 Skill / 暂无结果）展示策略：
   * - 如果用户做了筛选（搜索关键词 / 标签），但结果为空：提示“暂无匹配”，并给出“清空筛选”动作
   * - 如果用户未筛选且仍为空：提示“暂无 Skill”，引导用户去提交（右上角 +Skill / Issue 链接）
   */
  // ids 仅在 skills 模式下生效：实践模式不应因为 URL 带了 ids 而误判“有筛选”。
  const hasFilters = Boolean(query) || (tag && tag !== "全部") || (mode === "skills" && Boolean(ids));

  useEffect(() => {
    setQuery(initial.q || "");
    setPage(1);
  }, [initial.q]);

  useEffect(() => {
    // tag 变化（例如：分享链接 / 浏览器前进后退）时，需要把 state 同步回 URL 的真实值。
    setTag(initial.tag || "全部");
    setPage(1);
  }, [initial.tag]);

  useEffect(() => {
    // sort 变化（例如：分享链接 / 浏览器前进后退）时，需要把 state 同步回 URL 的真实值。
    const defaultSort = initial.mode === "practices" ? "recent" : "heat";
    setSort(initial.sort || defaultSort);
    setPage(1);
  }, [initial.sort, initial.mode]);

  useEffect(() => {
    // ids 变化代表“指定 Skill 集合”筛选变化，需要同步到 state 并回到第一页。
    setIds(initial.ids || "");
    setPage(1);
  }, [initial.ids]);

  useEffect(() => {
    // URL mode 变化（例如：分享链接 / 浏览器前进后退）时，客户端同步切换模式。
    const nextMode: HomeMode = initial.mode === "practices" ? "practices" : "skills";
    setMode(nextMode);
    // PRD：切换模式时回到第一页，避免分页状态在两个模式间“串页”。
    setPage(1);
  }, [initial.mode]);

  /**
   * URL 同步工具函数（避免散落在多个 handler 里重复拼接逻辑）
   * ------------------------------------------------------------
   * 设计目标：
   * - 让筛选条（tag/sort/ids/mode）与 URL 保持一致，刷新/分享/回退都“可预期”
   * - push 默认不滚动（保持用户当前视野稳定）
   */
  const pushSearchParams = (nextSearch: URLSearchParams, options?: { scroll?: boolean; replace?: boolean }) => {
    const qs = nextSearch.toString();
    const href = qs ? `${safePathname}?${qs}` : safePathname;
    const scroll = options?.scroll ?? false;
    if (options?.replace) {
      router.replace(href, { scroll });
    } else {
      router.push(href, { scroll });
    }
  };

  const params = useMemo(() => {
    const search = new URLSearchParams();
    search.set("page", String(page));
    search.set("size", String(PAGE_SIZE));
    if (tag && tag !== "全部") search.set("tag", tag);
    if (query) search.set("q", query);
    if (sort) search.set("sort", sort);
    // ids 仅在 skills 模式下参与请求（实践列表不支持该参数，避免“看起来像筛选生效但其实没用”的错觉）。
    if (mode === "skills" && ids) search.set("ids", ids);
    return search.toString();
  }, [page, tag, query, sort, ids, mode]);

  // 设备判定：本期 tablet 按 desktop 处理，避免扩大改造范围。
  const isMobile = deviceKind === "mobile";

  useEffect(() => {
    let cancelled = false;
    const fetchFeatured = async () => {
      // 保持首屏进入时的“骨架卡片”可见，直到数据到达。
      setFeaturedLoading(true);
      try {
        const res = await fetch("/api/practices/featured", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setFeatured(json.data || []);
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
        }
      } finally {
        if (!cancelled) {
          setFeaturedLoading(false);
        }
      }
    };
    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // 仅在「刷 Skill」模式请求 skills，避免在实践模式下做无意义请求。
    if (mode !== "skills") {
      return;
    }
    let cancelled = false;
    const fetchSkills = async () => {
      setLoading(true);
      setSkillsError(null);
      try {
        const res = await fetch(`/api/skills?${params}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "加载失败");
        }
        const payload = json as Paginated<Skill>;
        if (!cancelled) {
          const next = payload.data || [];
          // 移动端无限滚动：第 2 页起做“追加”而非“整页替换”。
          if (isMobile && page > 1) {
            setSkills((prev) => {
              const map = new Map<number, Skill>();
              for (const item of prev) map.set(item.id, item);
              for (const item of next) map.set(item.id, item);
              return Array.from(map.values());
            });
          } else {
            setSkills(next);
          }
          setTotalPages(payload.totalPages || 1);
        }
      } catch (err: any) {
        if (!cancelled) {
          setSkills([]);
          setTotalPages(1);
          setSkillsError(err?.message || "加载失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          // 只要请求完成（成功/失败）就置为 true，空状态可在此后展示。
          setHasLoaded(true);
        }
      }
    };
    fetchSkills();
    return () => {
      cancelled = true;
    };
  }, [params, mode, isMobile, page, skillsReloadKey]);

  useEffect(() => {
    // 仅在「实践模式」请求 practices，避免在刷 Skill 下做无意义请求。
    if (mode !== "practices") {
      return;
    }

    let cancelled = false;
    const fetchPractices = async () => {
      setPracticeLoading(true);
      setPracticeError(null);
      try {
        const res = await fetch(`/api/practices?${params}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "加载失败");
        }
        const payload = json as Paginated<PracticeWithSkills>;
        if (!cancelled) {
          const next = payload.data || [];
          // 移动端无限滚动：第 2 页起做“追加”而非“整页替换”。
          if (isMobile && page > 1) {
            setPractices((prev) => {
              const map = new Map<number, PracticeWithSkills>();
              for (const item of prev) map.set(item.id, item);
              for (const item of next) map.set(item.id, item);
              return Array.from(map.values());
            });
          } else {
            setPractices(next);
          }
          setPracticeTotalPages(payload.totalPages || 1);
        }
      } catch (err: any) {
        if (!cancelled) {
          setPractices([]);
          setPracticeTotalPages(1);
          setPracticeError(err?.message || "加载失败");
        }
      } finally {
        if (!cancelled) {
          setPracticeLoading(false);
          setPracticeHasLoaded(true);
        }
      }
    };

    fetchPractices();
    return () => {
      cancelled = true;
    };
  }, [params, mode, practiceReloadKey, isMobile, page]);

  const handleTagChange = (next: string) => {
    /**
     * 方案 2A（用户确认）：
     * - 如果当前处于 `ids` 的“关联技能锁定集合”筛选中
     * - 用户点击任何分类标签（包括“全部”）都代表想回到“全站分类筛选”语义
     * - 因此：先清掉 ids，再应用 tag
     *
     * 同时：把 tag 写回 URL，确保刷新/分享链接不会丢状态。
     */
    const nextSearch = new URLSearchParams(searchParams?.toString() || "");
    if (mode === "skills" && ids) {
      nextSearch.delete("ids");
      setIds("");
    }
    if (next && next !== "全部") {
      nextSearch.set("tag", next);
    } else {
      nextSearch.delete("tag");
    }
    pushSearchParams(nextSearch);

    setTag(next);
    setPage(1);
  };

  const handleSortChange = (next: string) => {
    // 排序属于全局筛选：写回 URL，确保刷新/分享/回退一致。
    const nextSearch = new URLSearchParams(searchParams?.toString() || "");
    nextSearch.set("sort", next);
    pushSearchParams(nextSearch);

    setSort(next);
    setPage(1);
  };

  const handleModeChange = (next: HomeMode) => {
    if (next === mode) {
      return;
    }

    // PRD：切换模式时重置到顶部，避免用户“迷失在列表中间”。
    window.scrollTo({ top: 0 });

    // 同步 URL：mode=practices 可分享；skills 为默认值，URL 不写 mode 参数。
    const nextSearch = new URLSearchParams(searchParams?.toString() || "");
    if (next === "practices") {
      nextSearch.set("mode", "practices");
      // ids 仅对 skills 模式有意义：进入实践模式时清掉，避免用户后续切回 skills 时“突然被锁定集合”。
      nextSearch.delete("ids");
      /**
       * 小优化：实践模式默认展示“最新”
       * ----------------------------------------------------------
       * 仅在 URL 没有显式 sort 时才使用默认值：
       * - 这样不会打断用户已经做过的“最热/最新”选择
       * - 同时避免先以旧 sort 请求一次，再被 URL 同步 effect 改回默认造成重复请求/闪动
       */
      if (!nextSearch.get("sort")) {
        setSort("recent");
      }
    } else {
      nextSearch.delete("mode");
      // 对称处理：skills 模式默认展示“最热”
      if (!nextSearch.get("sort")) {
        setSort("heat");
      }
    }

    pushSearchParams(nextSearch, { scroll: true });
    setMode(next);
    setPage(1);
  };

  /**
   * 清空 ids（关联技能锁定）：
   * - 显式 Chip 的“×”操作
   * - 需要同步更新 URL，避免刷新/分享仍携带 ids 造成“幽灵筛选”
   */
  const handleClearIds = () => {
    if (!ids) return;
    const nextSearch = new URLSearchParams(searchParams?.toString() || "");
    nextSearch.delete("ids");
    pushSearchParams(nextSearch);
    setIds("");
    setPage(1);
  };

  // 顶部筛选条的 loading/禁用状态需要随模式切换：实践模式下以 practiceLoading 为准。
  const listLoading = mode === "skills" ? loading : practiceLoading;

  /**
   * “筛选相关 Skill”（移动端同页切换方案）
   * ------------------------------------------------------------
   * 需求：
   * - 在 skills 模式展示 ids 锁定集合（Chip 可清除）
   * - 为避免“原筛选条件导致列表为空”让用户困惑：
   *   这里构造一个“干净”的 URL（不带 q/tag/mode），只保留 ids + sort
   *   行为与桌面端“新开 Tab”保持一致（只是打开方式不同）
   */
  const handleFilterSkillsByIds = (skillIds: number[]) => {
    if (!skillIds.length) return;

    // 切换模式时回到顶部，保持移动端体验一致。
    window.scrollTo({ top: 0 });

    const current = new URLSearchParams(searchParams?.toString() || "");
    const next = new URLSearchParams();
    next.set("ids", skillIds.join(","));
    // sort 继承当前页面（若没有则默认 heat）
    next.set("sort", current.get("sort") || "heat");

    pushSearchParams(next, { scroll: true });

    // 同步本地 state：避免“URL 已变但 UI 还停留在旧模式/旧筛选”的短暂割裂。
    setMode("skills");
    setIds(skillIds.join(","));
    setTag("全部");
    setQuery("");
    setPage(1);
  };

  const handleMobileLoadMore = () => {
    // 由视图层判定 hasMore，这里只做“安全递增”。
    setPage((prev) => prev + 1);
  };

  const handleMobileRetry = () => {
    // retry 只需要触发一次“重新请求”，无需额外修改筛选条件。
    if (mode === "skills") {
      setSkillsReloadKey((key) => key + 1);
      return;
    }
    setPracticeReloadKey((key) => key + 1);
  };

  // 移动端：使用专属 View（两列网格 + 无限滚动 + ActionSheet）。
  if (isMobile) {
    return (
      <HomeMobileView
        mode={mode}
        tag={tag}
        sort={sort}
        page={page}
        featured={featured}
        featuredLoading={featuredLoading}
        idsCount={idsCount}
        skills={{
          items: skills,
          loading,
          hasLoaded,
          error: skillsError,
          totalPages,
        }}
        practices={{
          items: practices,
          loading: practiceLoading,
          hasLoaded: practiceHasLoaded,
          error: practiceError,
          totalPages: practiceTotalPages,
        }}
        onModeChange={handleModeChange}
        onTagChange={handleTagChange}
        onSortChange={handleSortChange}
        onClearIds={handleClearIds}
        onLoadMore={handleMobileLoadMore}
        onRetry={handleMobileRetry}
        onFilterSkillsByIds={handleFilterSkillsByIds}
      />
    );
  }

  return (
    <>
      <FeaturedCarousel practices={featured} loading={featuredLoading} />
      <ModeDock mode={mode} onChange={handleModeChange} />

      <main className="page">
        <section className="toolbar" id="skill-list" aria-label="筛选与排序">
          <div className="toolbar__left" aria-label="分类与关联筛选">
            <nav className="segmented" aria-label="标签筛选（单选）">
              {TAG_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`segmented__item ${item === tag ? "is-active" : ""}`}
                  onClick={() => handleTagChange(item)}
                  // data-loading 用于触发按钮“过渡态”视觉反馈（见 app/globals.css）。
                  data-loading={listLoading && item === tag}
                  aria-busy={listLoading && item === tag}
                  disabled={listLoading}
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* 仅 skills 模式下展示“关联技能锁定”Chip，避免实践模式出现“看不懂的筛选条件”。 */}
            {mode === "skills" && idsCount > 0 ? (
              <button
                className="filter-chip"
                type="button"
                onClick={handleClearIds}
                disabled={listLoading}
                aria-label={`已启用关联技能筛选（${idsCount} 个），点击清除`}
                title="当前仅展示该文章关联的 Skills。点击清除恢复全量。"
              >
                <Filter className="icon" aria-hidden="true" />
                <span className="filter-chip__text">关联技能（{idsCount}）</span>
                <X className="icon filter-chip__close" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="toolbar__right">
            <div className="sort-switch" role="group" aria-label="排序">
              <div className="sort-switch__seg" data-active={sort}>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`sort-switch__btn ${option.value === sort ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={option.value === sort}
                    onClick={() => handleSortChange(option.value)}
                    // 排序切换同样走接口更新，加载时给激活态按钮一个过渡态提示。
                    data-loading={listLoading && option.value === sort}
                    aria-busy={listLoading && option.value === sort}
                    disabled={listLoading}
                  >
                    {option.value === "heat" ? <Flame className="icon" /> : <Clock className="icon" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {mode === "skills" ? (
          <section className="skill-grid" aria-label="Skill 列表" aria-busy={loading}>
            {loading || !hasLoaded ? (
              // 加载态：骨架屏替代空白 + 文案，避免“暂无 Skill”闪现。
              Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <SkillCardSkeleton key={`skill-skeleton-${index}`} />
              ))
            ) : skillsError ? (
              <EmptyState
                title="加载失败"
                description={skillsError}
                icon={<TriangleAlert className="icon" />}
                action={
                  <button
                    className="btn btn--soft btn--sm"
                    type="button"
                    onClick={() => setSkillsReloadKey((key) => key + 1)}
                    aria-label="重试加载 Skill 列表"
                  >
                    <RefreshCcw className="icon" aria-hidden="true" />
                    重试
                  </button>
                }
              />
            ) : skills.length === 0 ? (
              <EmptyState
                title={hasFilters ? "暂无匹配的 Skill" : "暂无 Skill"}
                description={
                  hasFilters
                    ? "试试清空搜索或切换标签，可能会发现更多高质量实践。"
                    : "还没有人提交 Skill，点击右上角「+ Skill」成为第一个贡献者吧。"
                }
                icon={hasFilters ? <SearchX className="icon" /> : <Sparkles className="icon" />}
                action={
                  hasFilters ? (
                    /**
                     * 使用原生 <a> 直接回到首页：
                     * - 可以“一次性”清掉 URL query（q/tag/sort 等）
                     * - 同时把本地 state（tag/sort/page）恢复为默认值
                     * - 避免额外引入 router 逻辑，让空态交互保持极简
                     */
                    <a className="btn btn--soft btn--sm" href="/" aria-label="清空筛选并回到首页">
                      <FilterX className="icon" aria-hidden="true" />
                      清空筛选
                    </a>
                  ) : (
                    /**
                     * 当前没有任何 Skill：引导用户去提交
                     * - 使用外链（Issue 表单）与 Header 的“+Skill”入口一致
                     */
                    <a
                      className="btn btn--primary btn--sm"
                      // 指向创建 Skill 的 Issue 表单，与右上角“+ Skill”入口保持一致。
                      href={SKILL_ISSUE_URL}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="去提交 Skill（新窗口）"
                    >
                      <Plus className="icon" aria-hidden="true" />
                      提交 Skill
                    </a>
                  )
                }
              />
            ) : (
              skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)
            )}
          </section>
        ) : (
          <section className="practice-feed-grid" aria-label="实践文章列表" aria-busy={practiceLoading}>
            {practiceLoading || !practiceHasLoaded ? (
              Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <PracticeFeedCardSkeleton key={`practice-skeleton-${index}`} />
              ))
            ) : practiceError ? (
              <EmptyState
                title="加载失败"
                description={practiceError}
                icon={<TriangleAlert className="icon" />}
                action={
                  <button
                    className="btn btn--soft btn--sm"
                    type="button"
                    onClick={() => setPracticeReloadKey((key) => key + 1)}
                    aria-label="重试加载实践列表"
                  >
                    <RefreshCcw className="icon" aria-hidden="true" />
                    重试
                  </button>
                }
              />
            ) : practices.length === 0 ? (
              <EmptyState
                title={hasFilters ? "暂无匹配的文章" : "暂无文章"}
                description={hasFilters ? "试试清空搜索或切换分类，可能会发现更多高质量实践。"
                  : "暂无文章，稍后再来看看。"}
                icon={hasFilters ? <SearchX className="icon" /> : <Sparkles className="icon" />}
                action={
                  hasFilters ? (
                    // 清空筛选但保留 mode=practices（PRD：模式可分享且 URL 优先）。
                    <a
                      className="btn btn--soft btn--sm"
                      href="/?mode=practices"
                      aria-label="清空筛选并回到实践模式首页"
                    >
                      <FilterX className="icon" aria-hidden="true" />
                      清空筛选
                    </a>
                  ) : null
                }
              />
            ) : (
              practices.map((practice) => <PracticeFeedCard key={practice.id} practice={practice} />)
            )}
          </section>
        )}

        {/* 分页按钮也走接口，加载中给按钮一个可感知的过渡态。 */}
        <Pagination
          page={page}
          totalPages={mode === "skills" ? totalPages : practiceTotalPages}
          onPageChange={setPage}
          loading={mode === "skills" ? loading : practiceLoading}
        />
      </main>
    </>
  );
}
