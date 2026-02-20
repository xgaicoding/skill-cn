"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SKILL_ISSUE_URL, TAG_OPTIONS, SORT_OPTIONS, PAGE_SIZE } from "@/lib/constants";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { BoardEntry, HomeMetrics, Paginated, Practice, PracticeWithSkills, Skill } from "@/lib/types";
import type { DeviceKind } from "@/lib/device";
import SkillCard from "@/components/home/SkillCard";
import { SkillCardSkeleton } from "@/components/SkillCardSkeleton";
import HomeRetentionBanner from "@/components/home/HomeRetentionBanner";
import PracticeDiscoveryBanner from "@/components/home/PracticeDiscoveryBanner";
import Pagination from "@/components/home/Pagination";
import EmptyState from "@/components/EmptyState";
import ModeDock, { type HomeMode } from "@/components/home/ModeDock";
import PracticeFeedCard from "@/components/home/PracticeFeedCard";
import PracticeFeedCardSkeleton from "@/components/home/PracticeFeedCardSkeleton";
import { Clock, Filter, FilterX, Flame, Plus, RefreshCcw, SearchX, Sparkles, TriangleAlert, X } from "lucide-react";
import HomeMobileView from "@/components/home/mobile/HomeMobileView";
import { trackEvent } from "@/lib/analytics";

export type HomeInitialState = {
  q?: string;
  tag?: string;
  sort?: string;
  mode?: string;
  /**
   * practices 模式的时间窗口筛选：
   * - 当前仅支持 `7d`（近 7 天）
   * - 由首页 KPI「本周上新」点击写入
   */
  window?: string;
  // ids=1,2,3：用于"从实践卡片筛选相关 Skill"场景（仅展示指定 Skill 列表）
  ids?: string;
};

/**
 * 首页 KPI 点击动作 key（与 HomeRetentionBanner 的 KPI 配置保持同口径）。
 */
type HomeKpiActionKey =
  | "practice_total"
  | "practice_weekly_new"
  | "skill_featured_total"
  | "download_total";

export default function HomePage({
  initial,
  deviceKind = "desktop",
  initialSkills,
  initialTotalPages,
  initialFeatured,
  initialHotBoardEntries,
  initialHomeMetrics,
}: {
  initial: HomeInitialState;
  /**
   * 设备类型（来自 Server Component UA 判断）：
   * - mobile：渲染移动端专属 View（v1.2.0）
   * - tablet/desktop：本期统一按桌面 View 处理
   */
  deviceKind?: DeviceKind;
  /**
   * 首页首屏 SSR 预取的 Skill 列表（仅默认首页注入）：
   * - 允许为空数组（代表"确实没有数据"）
   * - undefined 表示未预取（仍走原有 CSR 拉取）
   */
  initialSkills?: Skill[];
  /**
   * SSR 预取对应的总页数（与初始技能列表一致）。
   */
  initialTotalPages?: number;
  /**
   * 首屏“每周精选”SSR 预取数据（仅默认首页 + PC 注入）：
   * - undefined：未预取，客户端按旧逻辑展示 loading 后再拉取
   * - []：已预取但当前无数据，首屏直接渲染空态（不闪骨架）
   */
  initialFeatured?: Practice[];
  /**
   * 首屏“热门榜单”SSR 预取数据（仅默认首页 + PC 注入）。
   */
  initialHotBoardEntries?: BoardEntry[];
  /**
   * 首屏 KPI SSR 预取数据（仅默认首页 + PC 注入）：
   * - null：已预取但聚合失败（组件会展示 `—`）
   * - undefined：未预取，组件保留旧的 loading 过程
   */
  initialHomeMetrics?: HomeMetrics | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Next 的 usePathname 在部分类型版本下可能返回 null，这里统一兜底为首页根路径。
  const safePathname = pathname || "/";
  // 设备判定：本期只改 PC 首屏，mobile 分支保持现状。
  const isMobile = deviceKind === "mobile";

  // 默认模式保持当前行为：刷 Skill；当 URL 带 mode=practices 时进入实践模式（可分享/刷新保持）。
  const initialMode: HomeMode = initial.mode === "practices" ? "practices" : "skills";
  const [mode, setMode] = useState<HomeMode>(initialMode);

  const [tag, setTag] = useState(initial.tag || "全部");
  /**
   * 排序默认值（小优化）：
   * - skills 模式：默认"最热"（heat）
   * - practices 模式：默认"最新"（recent）
   *
   * 注意：
   * - 如果 URL 明确带了 sort，则尊重 URL（例如用户主动切换到"最热"）
   * - 如果 URL 没带 sort，则使用各自模式的默认值，避免用户感觉"怎么默认不是最新"
   */
  const defaultSortForInitialMode = initialMode === "practices" ? "recent" : "heat";
  const [sort, setSort] = useState(initial.sort || defaultSortForInitialMode);
  const [query, setQuery] = useState(initial.q || "");
  // skills 列表的"指定 id 过滤"（例如从实践卡片点"筛选相关 Skill"进入）
  const [ids, setIds] = useState(initial.ids || "");
  /**
   * practices 时间窗口筛选：
   * - 仅支持 "7d"；其它值统一降级为空
   * - 仅在 practices 模式参与请求参数拼装
   */
  const [practiceWindow, setPracticeWindow] = useState<"" | "7d">(initial.window === "7d" ? "7d" : "");
  const [page, setPage] = useState(1);

  /**
   * SSR 预取标记：
   * - 只要 props 有传入（即使是空数组），就认为首屏已经"有结果"
   * - 用于控制加载态与空状态的展示逻辑
   */
  const hasInitialSkills = typeof initialSkills !== "undefined";

  const [skills, setSkills] = useState<Skill[]>(initialSkills || []);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  // 首屏默认视为加载中；若已 SSR 预取，则直接视为"已加载完成"。
  const [loading, setLoading] = useState(!hasInitialSkills);
  // 标记是否完成过至少一次请求，用于控制空状态的显示时机。
  const [hasLoaded, setHasLoaded] = useState(hasInitialSkills);
  // skills 请求错误信息（移动端需要"失败重试"，桌面端也可复用该口径）。
  const [skillsError, setSkillsError] = useState<string | null>(null);
  // retry 触发器：递增即可强制重新请求（避免把 fetch 逻辑暴露到渲染层）。
  const [skillsReloadKey, setSkillsReloadKey] = useState(0);

  const [practices, setPractices] = useState<PracticeWithSkills[]>([]);
  const [practiceTotalPages, setPracticeTotalPages] = useState(1);
  // 实践模式加载态：与 skills 类似，首屏默认视为加载中，避免"空态闪现"。
  const [practiceLoading, setPracticeLoading] = useState(true);
  const [practiceHasLoaded, setPracticeHasLoaded] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  // retry 触发器：递增即可强制重新请求（避免把 fetch 逻辑暴露到渲染层）。
  const [practiceReloadKey, setPracticeReloadKey] = useState(0);

  /**
   * 首屏榜单/KPI 的 SSR 预取标记：
   * - 与 initialSkills 的判定语义保持一致：只要 props 存在（即使是空数组），都算“已预取”
   * - 用于抑制 hydration 后“内容 -> 骨架”的闪烁
   */
  const hasInitialFeatured = typeof initialFeatured !== "undefined";
  const hasInitialHotBoardEntries = typeof initialHotBoardEntries !== "undefined";
  const hasInitialHomeMetrics = typeof initialHomeMetrics !== "undefined";

  const [featured, setFeatured] = useState<Practice[]>(initialFeatured || []);
  // Hero 推荐卡片加载状态：SSR 已预取时直接置为 false，避免首屏骨架闪烁。
  const [featuredLoading, setFeaturedLoading] = useState(!hasInitialFeatured);
  // PC 首屏 KPI（4 项）数据：接口失败时允许降级展示 `—`，不阻断页面渲染。
  const [homeMetrics, setHomeMetrics] = useState<HomeMetrics | null>(initialHomeMetrics ?? null);
  const [homeMetricsLoading, setHomeMetricsLoading] = useState(!hasInitialHomeMetrics);
  // PC 右侧热门榜单（近 7 天）：与每周精选共用卡片结构。
  const [hotBoardEntries, setHotBoardEntries] = useState<BoardEntry[]>(initialHotBoardEntries || []);
  const [hotBoardLoading, setHotBoardLoading] = useState(!hasInitialHotBoardEntries);

  /**
   * 解析 ids=1,2,3... 的数量（去重后），用于展示"关联技能筛选"Chip。
   * 说明：
   * - ids 由实践卡片"筛选相关 Skill"进入时写入 URL
   * - 该筛选属于"特殊上下文"，需要显式提示用户当前处于"锁定集合"状态
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
   * 默认首屏请求判断：
   * - 用于决定是否沿用 SSR 预取结果（避免内容 -> 骨架 的闪动）
   * - 只覆盖"默认首页 + 第 1 页 + 最热排序"
   */
  const isDefaultSkillRequest = useMemo(() => {
    return (
      mode === "skills" &&
      page === 1 &&
      !query &&
      (!tag || tag === "全部") &&
      !ids &&
      sort === "heat"
    );
  }, [mode, page, query, tag, ids, sort]);

  /**
   * 首页空状态（暂无 Skill / 暂无结果）展示策略：
   * - 如果用户做了筛选（搜索关键词 / 标签），但结果为空：提示"暂无匹配"，并给出"清空筛选"动作
   * - 如果用户未筛选且仍为空：提示"暂无 Skill"，引导用户去提交（右上角 +Skill / Issue 链接）
   */
  // ids 仅在 skills 模式下生效：实践模式不应因为 URL 带了 ids 而误判"有筛选"。
  const hasFilters =
    Boolean(query) ||
    (tag && tag !== "全部") ||
    (mode === "skills" && Boolean(ids)) ||
    (mode === "practices" && practiceWindow === "7d");

  /**
   * 每周精选榜单数据（来源：/api/practices/featured）转换为首屏榜单统一结构。
   * ------------------------------------------------------------
   * 这样可以保证「每周精选」与「热门榜单」走同一套卡片组件，避免样式分叉。
   */
  const weeklyBoardEntries = useMemo<BoardEntry[]>(() => {
    return (featured || []).map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      channel: item.channel,
      author_name: item.author_name,
      source_url: item.source_url,
      updated_at: item.updated_at,
      skill_name: item.skill_name ?? null,
    }));
  }, [featured]);

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
    // ids 变化代表"指定 Skill 集合"筛选变化，需要同步到 state 并回到第一页。
    setIds(initial.ids || "");
    setPage(1);
  }, [initial.ids]);

  useEffect(() => {
    /**
     * URL window 同步：
     * - 只接受 7d，其它值统一视为“无窗口筛选”
     * - 保证前进/后退后，列表筛选与 URL 完整一致
     */
    setPracticeWindow(initial.window === "7d" ? "7d" : "");
    setPage(1);
  }, [initial.window]);

  useEffect(() => {
    // URL mode 变化（例如：分享链接 / 浏览器前进后退）时，客户端同步切换模式。
    const nextMode: HomeMode = initial.mode === "practices" ? "practices" : "skills";
    setMode(nextMode);
    // PRD：切换模式时回到第一页，避免分页状态在两个模式间"串页"。
    setPage(1);
  }, [initial.mode]);

  /**
   * 统一记录"已发现实践模式"：
   * - 覆盖通过 URL 直达 / 前进后退 / 点击切换三种入口
   * - 避免在多个 handler 内重复写入（且 key 统一走常量）
   */
  const markPracticeModeDiscovered = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRACTICE_MODE_DISCOVERED, "1");
    } catch {
      // localStorage 不可用时，静默失败（保持 UI 逻辑不受影响）。
    }
  };

  useEffect(() => {
    // 只要进入 practices 模式就记录为"已发现"，保证直接访问链接也会被记录。
    if (mode === "practices") {
      markPracticeModeDiscovered();
    }
  }, [mode]);

  /**
   * URL 同步工具函数（避免散落在多个 handler 里重复拼接逻辑）
   * ------------------------------------------------------------
   * 设计目标：
   * - 让筛选条（tag/sort/ids/mode）与 URL 保持一致，刷新/分享/回退都"可预期"
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
    // ids 仅在 skills 模式下参与请求（实践列表不支持该参数，避免"看起来像筛选生效但其实没用"的错觉）。
    if (mode === "skills" && ids) search.set("ids", ids);
    // practices 时间窗口筛选（当前仅 7d）；skills 模式不传递该参数。
    if (mode === "practices" && practiceWindow === "7d") {
      search.set("window", "7d");
    }
    return search.toString();
  }, [page, tag, query, sort, ids, mode, practiceWindow]);

  useEffect(() => {
    let cancelled = false;
    const fetchFeatured = async () => {
      /**
       * 若服务端已注入首屏数据，则后台刷新时不再回退到骨架：
       * - 保持可读文本持续可见（SEO/UX 一致）
       * - 仅在“未预取”时展示 loading
       */
      if (!hasInitialFeatured) {
        setFeaturedLoading(true);
      }
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
  }, [hasInitialFeatured]);

  useEffect(() => {
    /**
     * 本期范围限定：仅 PC 首屏需要 KPI 聚合数据。
     * - mobile 直接跳过请求，避免无意义网络开销。
     * - 同时把 loading 置为 false，避免传递到桌面组件时出现误状态。
     */
    if (isMobile) {
      setHomeMetricsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchHomeMetrics = async () => {
      // SSR 已预取时，刷新过程不再回退到骨架。
      if (!hasInitialHomeMetrics) {
        setHomeMetricsLoading(true);
      }
      try {
        const res = await fetch("/api/home/metrics", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setHomeMetrics((json?.data || null) as HomeMetrics | null);
        }
      } catch {
        if (!cancelled) {
          setHomeMetrics(null);
        }
      } finally {
        if (!cancelled) {
          setHomeMetricsLoading(false);
        }
      }
    };

    fetchHomeMetrics();
    return () => {
      cancelled = true;
    };
  }, [isMobile, hasInitialHomeMetrics]);

  useEffect(() => {
    /**
     * 本期范围限定：仅 PC 首屏需要热门榜单数据。
     * - mobile 保持现有交互，不额外请求热榜接口。
     */
    if (isMobile) {
      setHotBoardLoading(false);
      return;
    }

    let cancelled = false;

    const fetchHotBoard = async () => {
      // SSR 已预取时，刷新过程不再回退到骨架。
      if (!hasInitialHotBoardEntries) {
        setHotBoardLoading(true);
      }
      try {
        const res = await fetch("/api/practices/hot?window=7d&limit=9", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setHotBoardEntries((json?.data || []) as BoardEntry[]);
        }
      } catch {
        if (!cancelled) {
          setHotBoardEntries([]);
        }
      } finally {
        if (!cancelled) {
          setHotBoardLoading(false);
        }
      }
    };

    fetchHotBoard();
    return () => {
      cancelled = true;
    };
  }, [isMobile, hasInitialHotBoardEntries]);

  useEffect(() => {
    // 仅在「刷 Skill」模式请求 skills，避免在实践模式下做无意义请求。
    if (mode !== "skills") {
      return;
    }
    let cancelled = false;
    const fetchSkills = async () => {
      /**
       * 若首屏已由 SSR 预取填充，则不再触发骨架屏：
       * - 避免 hydration 后"先显示内容 -> 又闪回加载态"的抖动
       */
      const shouldShowLoading = !(hasInitialSkills && isDefaultSkillRequest);
      if (shouldShowLoading) {
        setLoading(true);
      }
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
          // 移动端无限滚动：第 2 页起做"追加"而非"整页替换"。
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
  }, [params, mode, isMobile, page, skillsReloadKey, hasInitialSkills, isDefaultSkillRequest]);

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
          // 移动端无限滚动：第 2 页起做"追加"而非"整页替换"。
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
     * - 如果当前处于 `ids` 的"关联技能锁定集合"筛选中
     * - 用户点击任何分类标签（包括"全部"）都代表想回到"全站分类筛选"语义
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

    // PRD：切换模式时重置到顶部，避免用户"迷失在列表中间"。
    window.scrollTo({ top: 0 });

    // 同步 URL：mode=practices 可分享；skills 为默认值，URL 不写 mode 参数。
    const nextSearch = new URLSearchParams(searchParams?.toString() || "");
    if (next === "practices") {
      nextSearch.set("mode", "practices");
      // ids 仅对 skills 模式有意义：进入实践模式时清掉，避免用户后续切回 skills 时"突然被锁定集合"。
      nextSearch.delete("ids");
      /**
       * 小优化：实践模式默认展示"最新"
       * ----------------------------------------------------------
       * 仅在 URL 没有显式 sort 时才使用默认值：
       * - 这样不会打断用户已经做过的"最热/最新"选择
       * - 同时避免先以旧 sort 请求一次，再被 URL 同步 effect 改回默认造成重复请求/闪动
       */
      if (!nextSearch.get("sort")) {
        setSort("recent");
      }
    } else {
      nextSearch.delete("mode");
      // skills 模式不使用 practices 时间窗口筛选。
      nextSearch.delete("window");
      setPracticeWindow("");
      // 对称处理：skills 模式默认展示"最热"
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
   * - 显式 Chip 的"×"操作
   * - 需要同步更新 URL，避免刷新/分享仍携带 ids 造成"幽灵筛选"
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
   * "筛选相关 Skill"（移动端同页切换方案）
   * ------------------------------------------------------------
   * 需求：
   * - 在 skills 模式展示 ids 锁定集合（Chip 可清除）
   * - 为避免"原筛选条件导致列表为空"让用户困惑：
   *   这里构造一个"干净"的 URL（不带 q/tag/mode），只保留 ids + sort
   *   行为与桌面端"新开 Tab"保持一致（只是打开方式不同）
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

    // 同步本地 state：避免"URL 已变但 UI 还停留在旧模式/旧筛选"的短暂割裂。
    setMode("skills");
    setIds(skillIds.join(","));
    setPracticeWindow("");
    setTag("全部");
    setQuery("");
    setPage(1);
  };

  /**
   * 滚动到首页列表锚点（筛选条）：
   * - 统一用于 KPI 点击后的“视角落点”
   * - 动态读取 fixed header 的当前高度，避免被遮挡
   */
  const scrollToListAnchor = () => {
    const anchor = document.getElementById("skill-list");
    if (!anchor) return;

    const header = document.querySelector(".app-header");
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
    const top = window.scrollY + anchor.getBoundingClientRect().top - Math.ceil(headerBottom + 10);

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "smooth",
    });
  };

  /**
   * KPI 点击动作（首屏看板 -> 列表）：
   * ------------------------------------------------------------
   * 需求映射：
   * - 本周上新：切到 practices + window=7d（近 7 天）
   * - 案例数量：切到 practices（全量）
   * - 精选 Skill / 下载总量：切到 skills
   * - 所有场景都自动滚动到列表筛选条位置
   */
  const handleKpiClick = (key: HomeKpiActionKey) => {
    const nextSearch = new URLSearchParams(searchParams?.toString() || "");

    // ids 仅对 skills 模式生效：KPI 导航属于“模式切换入口”，统一清理避免语义冲突。
    nextSearch.delete("ids");
    setIds("");

    if (key === "practice_weekly_new") {
      nextSearch.set("mode", "practices");
      nextSearch.set("window", "7d");
      // 周更列表更关注新鲜度，默认拉到“最新”排序。
      nextSearch.set("sort", "recent");

      setMode("practices");
      setPracticeWindow("7d");
      setSort("recent");
      markPracticeModeDiscovered();
    } else if (key === "practice_total") {
      nextSearch.set("mode", "practices");
      nextSearch.delete("window");

      setMode("practices");
      setPracticeWindow("");
      markPracticeModeDiscovered();
    } else {
      // 精选 Skill / 下载总量：统一回到 skills 模式。
      nextSearch.delete("mode");
      nextSearch.delete("window");

      setMode("skills");
      setPracticeWindow("");
    }

    setPage(1);
    // KPI 点击需要记录，便于后续分析“从首屏看板到列表”的导流效果。
    trackEvent("home_kpi_click", { key });

    // 先同步 URL，再滚动，避免用户刷新后状态丢失。
    pushSearchParams(nextSearch, { scroll: false });
    // 等路由/state 落地后滚动，避免在布局更新前计算到错误位置。
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToListAnchor();
      });
    });
  };

  const handleMobileLoadMore = () => {
    // 由视图层判定 hasMore，这里只做"安全递增"。
    setPage((prev) => prev + 1);
  };

  const handleMobileRetry = () => {
    // retry 只需要触发一次"重新请求"，无需额外修改筛选条件。
    if (mode === "skills") {
      setSkillsReloadKey((key) => key + 1);
      return;
    }
    setPracticeReloadKey((key) => key + 1);
  };

  // 页面停留时长埋点
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      // 只记录停留 > 3 秒的
      if (duration > 3) {
        trackEvent("page_view_duration", {
          mode,
          duration_seconds: duration,
        });
      }
    };
  }, [mode]);

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
      <HomeRetentionBanner
        metrics={homeMetrics}
        metricsLoading={homeMetricsLoading}
        weeklyEntries={weeklyBoardEntries}
        weeklyLoading={featuredLoading}
        hotEntries={hotBoardEntries}
        hotLoading={hotBoardLoading}
        onKpiClick={handleKpiClick}
      />

      {/**
       * 实践模式引导 Banner（v1.5.6 能力保留）：
       * - 用户强调该能力不能丢失，故在首屏 Banner 后恢复挂载
       * - 组件内部自带 localStorage 记忆与显隐逻辑
       */}
      <PracticeDiscoveryBanner mode={mode} onTryNow={() => handleModeChange("practices")} />

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
                  // data-loading 用于触发按钮"过渡态"视觉反馈（见 app/globals.css）。
                  data-loading={listLoading && item === tag}
                  aria-busy={listLoading && item === tag}
                  disabled={listLoading}
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* 仅 skills 模式下展示"关联技能锁定"Chip，避免实践模式出现"看不懂的筛选条件"。 */}
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
              // 加载态：骨架屏替代空白 + 文案，避免"暂无 Skill"闪现。
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
                     * - 可以"一次性"清掉 URL query（q/tag/sort 等）
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
                     * - 使用外链（Issue 表单）与 Header 的"+Skill"入口一致
                     */
                    <a
                      className="btn btn--primary btn--sm"
                      // 指向创建 Skill 的 Issue 表单，与右上角"+ Skill"入口保持一致。
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
