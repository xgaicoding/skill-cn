"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  CalendarDays,
  CircleHelp,
  Copy,
  Check,
  Download,
  Eye,
  Flame,
  Github,
  Link2,
  User,
  Plus,
  Sparkles,
  Clock,
  Star,
  Tag,
  RefreshCcw,
} from "lucide-react";

import BodyClass from "@/components/BodyClass";
import { SkillDetailSkeleton } from "@/components/SkillDetailSkeleton";
import { Skeleton } from "@/components/Skeleton";
import { Loading } from "@/components/Loading";
import { PRACTICE_ISSUE_URL, PAGE_SIZE } from "@/lib/constants";
import { signInWithGitHub, useAuthUser } from "@/lib/auth";
import type { Paginated, Practice, Skill } from "@/lib/types";
import { formatCompactNumber, formatDate, formatHeat } from "@/lib/format";
import type { DeviceKind } from "@/lib/device";

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
 * MobilePracticeCardSkeleton：
 * - v1.2.0 移动端「关联实践」两列网格骨架
 * - 结构与 docs/1.2.0_mobile/mockup 一致：标题（2 行）+ 摘要多行 + footer
 * - 使用 app/mobile.css 的 m-skeleton-pulse（仅 opacity），性能更稳
 */
const MobilePracticeCardSkeleton = ({ index }: { index: number }) => {
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
};

/**
 * MobileDetailCardSkeleton：
 * - v1.2.0 移动端 Skill 详情页“信息卡”骨架
 * - 目标：加载中不出现一整块空白，而是呈现可读的结构占位（pills / 标题 / 描述 / 按钮）
 */
const MobileDetailCardSkeleton = () => {
  // 单卡内做轻微错峰，避免同一张卡里所有块同频闪烁
  const delays = ["0ms", "70ms", "120ms", "160ms", "210ms"];

  return (
    <article className="m-detail-card m-card--skeleton" aria-hidden="true">
      <div className="m-detail-card__top" aria-hidden="true">
        <div className="m-skeleton-block m-skeleton-pill" style={{ animationDelay: delays[0] }} />
        <div className="m-skeleton-block m-skeleton-pill m-skeleton-pill--sm" style={{ animationDelay: delays[1] }} />
      </div>

      {/* 标题（两行） */}
      <div className="m-skeleton-block m-skeleton-line m-skeleton-line--title" style={{ animationDelay: delays[2] }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "78%", animationDelay: delays[2] }} />

      {/* 描述（两行） */}
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "92%", animationDelay: delays[3] }} />
      <div className="m-skeleton-block m-skeleton-line" style={{ width: "70%", animationDelay: delays[3] }} />

      {/* 操作按钮（两列） */}
      <div className="m-detail-card__actions" aria-hidden="true">
        <div
          className="m-skeleton-block"
          style={{ height: 44, width: "100%", borderRadius: 14, animationDelay: delays[4] }}
        />
        <div
          className="m-skeleton-block"
          style={{ height: 44, width: "100%", borderRadius: 14, animationDelay: delays[4] }}
        />
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

export default function DetailPage({
  id,
  deviceKind = "desktop",
}: {
  id: string;
  /**
   * 设备类型（来自 Server Component UA 判断）：
   * - mobile：渲染移动端专属详情页（简化布局 + 关联实践两列无限滚动）
   * - tablet/desktop：保持现有桌面详情页逻辑
   */
  deviceKind?: DeviceKind;
}) {
  const skillId = Number(id);
  const isMobile = deviceKind === "mobile";
  const [skill, setSkill] = useState<Skill | null>(null);
  const [skillLoading, setSkillLoading] = useState(true);
  const { user } = useAuthUser();
  // 按钮级别的请求状态，用于展示“正在处理”的过渡态。
  const [downloadPending, setDownloadPending] = useState(false);
  const [submitPracticePending, setSubmitPracticePending] = useState(false);
  /**
   * v1.4.0：npx 命令复制状态（仅 PC）
   * - 用于在按钮上给出“已复制/复制失败”等轻量反馈
   * - 不使用全局 Toast，避免引入额外依赖与样式回归风险
   */
  const [npxCopyState, setNpxCopyState] = useState<"idle" | "copied" | "error">("idle");
  const npxCopyTimerRef = useRef<number | null>(null);

  const [practices, setPractices] = useState<Practice[]>([]);
  const [practicePage, setPracticePage] = useState(1);
  const [practiceTotalPages, setPracticeTotalPages] = useState(1);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [practiceReloadKey, setPracticeReloadKey] = useState(0);
  // 实践排序：参考首页“最热/最新”，热度按点击量，最新按更新时间。
  // 实践列表默认按「最新」展示：
  // - 对应 UI 上的「最新」分段按钮
  // - 与首页实践模式的默认排序保持一致，降低用户心智成本
  const [practiceSort, setPracticeSort] = useState<"heat" | "recent">("recent");

  /**
   * Mobile Toast（用于“PC 专属能力”降级提示）
   * ------------------------------------------------------------
   * 需求口径：
   * - 下载/投稿等 PC 专属能力，在移动端点击后统一 toast 提示：
   *   “请前往PC版网页使用功能”
   */
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
      toastTimerRef.current = null;
    }, 2000);
  };

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

  // 解析仓库主页地址：仅保留前两级路径（owner/repo），用于跳转仓库首页。
  const getRepoHomeUrl = (url?: string | null) => {
    if (!url) return "#";
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        parsed.pathname = `/${parts[0]}/${parts[1]}`;
        parsed.search = "";
        parsed.hash = "";
      }
      return parsed.toString();
    } catch {
      // 兜底：非标准 URL 时直接返回原字符串，避免跳转失效
      return url;
    }
  };

  const repoShort = useMemo(() => getRepoShort(skill?.source_url), [skill?.source_url]);
  const repoHomeUrl = useMemo(() => getRepoHomeUrl(skill?.source_url), [skill?.source_url]);
  // 默认支持下载 ZIP；若字段缺失，则按支持处理，避免影响历史数据。
  const supportsDownloadZip = skill?.supports_download_zip ?? true;
  /**
   * v1.4.0：npx 下载/安装指令（仅 PC）
   * - 命令框展示在「下载 ZIP」入口上方（与 ZIP 下载并行，不互斥）
   * - 允许为空：为空时不展示命令块，避免误导用户
   */
  const npxCommand = useMemo(() => (skill?.npx_download_command || "").trim(), [skill?.npx_download_command]);
  // 下载提示气泡的 id，用于 aria-describedby 与无障碍说明。
  const downloadHelpId = `download-help-${skillId}`;
  // v1.3.0：技能包提示气泡的 id（仅桌面端 hover/聚焦展示；移动端不做该交互）。
  const packageHelpId = `package-help-${skillId}`;
  /**
   * v1.3.0：技能包文档展示口径（仅 PC 端）
   * - 普通 Skill：展示 SKILL.md
   * - 技能包（is_package=true）：展示仓库根目录 README
   */
  const docTitle = skill?.is_package ? "README" : "SKILL.md";
  // README 读取自仓库根目录，因此“前往 Source”应指向仓库主页；普通 Skill 仍指向原 source_url（可能是子目录）。
  const docSourceUrl = skill?.is_package ? repoHomeUrl : skill?.source_url || "#";

  /**
   * 将 Markdown 内的相对链接/图片链接转换为 GitHub 绝对地址：
   * - 目标：避免因为存在相对链接（如 ./README.md、./images/a.png）而把整篇 Markdown 降级为纯文本
   * - 规则：
   *   - 仅处理相对 URL（非 http/https/mailto/tel/#）
   *   - 普通 Skill：相对路径基于 source_url 所在目录（可能是子目录）解析
   *   - 技能包：README 来自仓库根目录，因此基于根目录解析
   *   - 链接：转为 GitHub `blob/HEAD/...`（可阅读/可跳转）
   *   - 图片：转为 GitHub `raw/HEAD/...`（可直接展示图片）
   *
   * 性能与安全：
   * - 仅做字符串转换，不触发布局；对 `javascript:` 等危险协议做拦截
   */
  const resolveGitHubUri = (uri: string, kind: "link" | "image"): string => {
    const raw = (uri || "").trim();
    if (!raw) return raw;
    if (raw.startsWith("#")) return raw;
    if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
    if (/^javascript:/i.test(raw)) return "";

    // 兜底：repoHomeUrl 不是 github.com 时直接返回原值（避免误拼接导致更差体验）
    if (!repoHomeUrl || !repoHomeUrl.startsWith("https://github.com/")) {
      return raw;
    }

    // 解析 source_url 的目录（只用于普通 Skill；技能包固定以根目录为 base）
    const getBaseDirFromSourceUrl = (sourceUrl?: string | null): string => {
      if (!sourceUrl) return "";
      try {
        const parsed = new URL(sourceUrl);
        if (parsed.hostname !== "github.com") return "";
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (parts.length < 2) return "";

        // 结构：/owner/repo/(tree|blob)/ref/...
        if (parts.length >= 4 && (parts[2] === "tree" || parts[2] === "blob")) {
          const tail = parts.slice(4);
          if (tail.length === 0) return "";
          // 若 source_url 指向文件（blob），baseDir 应该是它的上级目录
          if (parts[2] === "blob") {
            return tail.slice(0, -1).join("/");
          }
          return tail.join("/");
        }

        return "";
      } catch {
        return "";
      }
    };

    const baseDir = skill?.is_package ? "" : getBaseDirFromSourceUrl(skill?.source_url);

    // 用 URL 做 posix 归一化：支持 ./ 与 ../
    // 注意：这里用 /\/+$/ 去掉尾部多余的斜杠，避免 baseDir 末尾自带 / 导致拼接出双斜杠。
    const base = `https://example.com/${baseDir ? `${baseDir.replace(/\/+$/, "")}/` : ""}`;
    let resolved: URL;
    try {
      resolved = new URL(raw, base);
    } catch {
      return raw;
    }

    // resolved.pathname 始终以 / 开头，这里去掉前导 /，得到仓库内相对路径
    const normalizedPath = resolved.pathname.replace(/^\/+/, "");
    const suffix = `${normalizedPath}${resolved.search || ""}${resolved.hash || ""}`;

    if (kind === "image") {
      return `${repoHomeUrl}/raw/HEAD/${suffix}`;
    }
    return `${repoHomeUrl}/blob/HEAD/${suffix}`;
  };

  /**
   * react-markdown v9 使用 urlTransform 统一处理所有 URL：
   * - key: 常见为 href（链接）/ src（图片）
   * - node: 当前 HAST 节点（这里不需要依赖它做判断，key 足够）
   *
   * 这里先用 react-markdown 内置的 defaultUrlTransform 做一次“安全过滤”，
   * 再做 GitHub 相对路径转换，最后再做一次安全过滤，避免引入危险协议。
   */
  const urlTransform = (url: string, key: string) => {
    const safeUrl = defaultUrlTransform(url);
    const kind = key === "src" ? "image" : "link";
    const resolved = resolveGitHubUri(safeUrl, kind);
    return defaultUrlTransform(resolved);
  };

  const practicesQuery = useMemo(() => {
    const search = new URLSearchParams();
    search.set("page", String(practicePage));
    search.set("size", String(PAGE_SIZE));
    search.set("sort", practiceSort);
    return search.toString();
  }, [practicePage, practiceSort]);

  useEffect(() => {
    /**
     * 当 skillId 变化时重置实践列表分页状态：
     * - 避免从上一个 Skill 的“第 N 页”带到新 Skill 导致空列表/越界
     * - 对移动端无限滚动同样必要：否则会把不同 skill 的实践 append 到一起
     */
    setPractices((prev) => (prev.length > 0 ? [] : prev));
    setPracticePage((prev) => (prev === 1 ? prev : 1));
    setPracticeTotalPages((prev) => (prev === 1 ? prev : 1));
    setPracticeError((prev) => (prev ? null : prev));

    /**
     * v1.4.0：skillId 变化时重置 npx 复制状态
     * - 避免从上一个 Skill 延续“已复制/复制失败”的反馈文案
     * - 同时清理定时器，防止切换详情页后仍触发 setState
     */
    setNpxCopyState("idle");
    if (npxCopyTimerRef.current) {
      window.clearTimeout(npxCopyTimerRef.current);
      npxCopyTimerRef.current = null;
    }
  }, [skillId]);

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
      setPracticeError(null);
      try {
        const res = await fetch(`/api/skills/${skillId}/practices?${practicesQuery}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "加载失败");
        }
        const payload = json as Paginated<Practice>;
        if (!cancelled) {
          const next = payload.data || [];
          // 无限滚动：第 2 页起做“追加”而非“整页替换”，避免滚动加载时丢失上一页内容。
          // - mobile：详情页关联实践两列网格无限滚动
          // - desktop：Skill 详情页下方实践卡片同样改为无限滚动
          if (practicePage > 1) {
            setPractices((prev) => {
              const map = new Map<number, Practice>();
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
          /**
           * 错误处理策略：
           * - 首屏（page=1）失败：清空列表，展示错误态（与原逻辑一致）
           * - 触底加载（page>1）失败：保留已加载的列表，仅展示底部错误提示，允许重试
           */
          if (practicePage <= 1) {
            setPractices([]);
            setPracticeTotalPages(1);
          }
          setPracticeError(err?.message || "加载失败");
        }
      } finally {
        if (!cancelled) setPracticeLoading(false);
      }
    };
    if (!Number.isNaN(skillId)) fetchPractices();
    return () => {
      cancelled = true;
    };
  }, [skillId, practicesQuery, isMobile, practicePage, practiceReloadKey]);

  const handleDownload = async () => {
    // 移动端降级：不执行真实下载逻辑，统一提示用户前往 PC。
    if (isMobile) {
      showToast("请前往PC版网页使用功能");
      return;
    }
    if (!skill || downloadPending) return;
    // 兜底：如果该 Skill 不支持下载 ZIP，则直接引导到官方地址。
    if (!supportsDownloadZip) {
      // 不支持下载时，兜底跳转仓库主页，避免落到具体目录。
      if (repoHomeUrl && repoHomeUrl !== "#") {
        window.open(repoHomeUrl, "_blank", "noreferrer");
      }
      return;
    }
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

  /**
   * v1.4.0：复制 npx 下载指令（仅 PC）
   * ------------------------------------------------------------
   * 复制策略：
   * 1) 优先使用 Clipboard API（现代浏览器 + HTTPS/localhost）
   * 2) 若失败，降级使用 `document.execCommand("copy")`（兼容老浏览器/特殊环境）
   *
   * 注意：
   * - 复制逻辑不应阻塞主线程太久；这里仅创建一个临时 textarea 后立即销毁
   * - 复制成功/失败用按钮文案做轻量反馈（“已复制/复制失败”），不影响页面其他交互
   */
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    const payload = (text || "").trim();
    if (!payload) return false;

    // 现代浏览器优先：navigator.clipboard
    try {
      if (window.isSecureContext && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        return true;
      }
    } catch {
      // ignore：继续走降级方案
    }

    // 降级：临时 textarea + execCommand
    let textarea: HTMLTextAreaElement | null = null;
    try {
      textarea = document.createElement("textarea");
      textarea.value = payload;
      textarea.setAttribute("readonly", "");
      // 放到视口外，避免滚动抖动；opacity=0 避免闪现
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      textarea.style.left = "-1000px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, payload.length);
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      if (textarea) {
        document.body.removeChild(textarea);
      }
    }
  };

  const handleCopyNpxCommand = async () => {
    // 仅 PC 端展示 npx 命令块；移动端不要求该能力。
    if (isMobile) return;
    if (!npxCommand) return;

    // 清理旧的反馈定时器，避免连续点击造成状态抖动。
    if (npxCopyTimerRef.current) {
      window.clearTimeout(npxCopyTimerRef.current);
      npxCopyTimerRef.current = null;
    }

    const ok = await copyTextToClipboard(npxCommand);
    setNpxCopyState(ok ? "copied" : "error");

    // 反馈仅短暂展示，然后自动恢复为“复制”。
    npxCopyTimerRef.current = window.setTimeout(() => {
      setNpxCopyState("idle");
      npxCopyTimerRef.current = null;
    }, ok ? 1600 : 2400);
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
    // 移动端降级：不执行登录/投稿跳转，统一提示用户前往 PC。
    if (isMobile) {
      showToast("请前往PC版网页使用功能");
      return;
    }
    // 实践投稿入口固定为 create-practice Issue 模板，避免依赖环境变量导致链接缺失。
    if (user) {
      window.open(PRACTICE_ISSUE_URL, "_blank", "noreferrer");
      return;
    }
    setSubmitPracticePending(true);
    try {
      await signInWithGitHub(PRACTICE_ISSUE_URL);
    } finally {
      setSubmitPracticePending(false);
    }
  };

  /**
   * 移动端关联实践：无限滚动触底加载
   * ------------------------------------------------------------
   * 说明：
   * - 本期不要求“返回恢复页数/滚动位置”，因此这里保持实现简单
   * - 触底加载的关键是“避免重复触发”：
   *   - 有下一页
   *   - 当前不在 loading
   *   - 当前没有 error
  */
  const practiceSentinelRef = useRef<HTMLDivElement | null>(null);
  // 防止 IntersectionObserver 在同一滚动段内重复触发，导致 page 连续递增。
  const practiceLoadMoreLockedRef = useRef(false);

  useEffect(() => {
    // 每次请求结束（loading=false）后解锁，允许下一次触底加载。
    if (!practiceLoading) {
      practiceLoadMoreLockedRef.current = false;
    }
  }, [practiceLoading]);

  useEffect(() => {
    const el = practiceSentinelRef.current;
    if (!el) {
      return;
    }
    // 当哨兵处于 display:none（例如桌面端切到 README Tab）时不触发加载。
    if (el.offsetParent === null) {
      return;
    }

    const hasMore = practicePage < (practiceTotalPages || 1);
    if (!hasMore) {
      return;
    }
    if (practiceLoading) {
      return;
    }
    if (practiceError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (practiceLoadMoreLockedRef.current) return;
        practiceLoadMoreLockedRef.current = true;
        setPracticePage((prev) => prev + 1);
      },
      {
        // 桌面端屏幕更高，提前一点触发体验更顺滑；移动端保持原 600px 口径。
        rootMargin: isMobile ? "600px 0px" : "800px 0px",
        threshold: 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, practiceLoading, practiceError, practicePage, practiceTotalPages]);

  /**
   * 无限滚动兜底：Scroll 监听
   * ------------------------------------------------------------
   * 为什么需要：
   * - 部分移动端 WebView（尤其是 iOS 某些内嵌浏览器）存在 IntersectionObserver 不触发/偶发失效的情况
   * - 用户会表现为“滑到底也不加载下一页”，非常影响体验
   *
   * 方案：
   * - 保留 IntersectionObserver（性能更好、语义更清晰）
   * - 同时增加一个 scroll-based fallback：当哨兵距离视口底部 <= 600px 时触发加载
   *
   * 说明：
   * - 这里使用 requestAnimationFrame 做轻量节流，避免高频 scroll 回调导致的性能问题
   * - 触发条件与 Observer 的 rootMargin 口径保持一致（600px），体验上更一致
   */
  useEffect(() => {
    let rafId: number | null = null;

    const maybeLoadMoreByScroll = () => {
      const el = practiceSentinelRef.current;
      if (!el) return;
      // 当哨兵不可见（display:none）时不触发加载，避免切到 README Tab 时误触发把实践全刷出来。
      if (el.offsetParent === null) return;

      const hasMore = practicePage < (practiceTotalPages || 1);
      if (!hasMore) return;
      if (practiceLoading) return;
      if (practiceError) return;
      if (practiceLoadMoreLockedRef.current) return;

      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;

      // 触发阈值：哨兵进入“视口底部往下 600px”范围即加载下一页（与 Observer rootMargin 对齐）
      const thresholdPx = isMobile ? 600 : 800;
      const shouldLoad = rect.top - viewportH <= thresholdPx;
      if (!shouldLoad) return;

      practiceLoadMoreLockedRef.current = true;
      setPracticePage((prev) => prev + 1);
    };

    const onScroll = () => {
      // rAF 节流：同一帧内最多执行一次检查
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        maybeLoadMoreByScroll();
      });
    };

    // 首次绑定时立即检查一次：
    // - 列表不足一屏时可直接触发下一页加载（避免用户“无路可滑”）
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [isMobile, practicePage, practiceTotalPages, practiceLoading, practiceError]);

  // 卸载时清理 toast 定时器，避免潜在的 setState on unmounted。
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      if (npxCopyTimerRef.current) {
        window.clearTimeout(npxCopyTimerRef.current);
        npxCopyTimerRef.current = null;
      }
    };
  }, []);

  // 详情页首屏加载：优先渲染骨架屏，避免空白页 + 文案闪烁。
  if (skillLoading) {
    if (isMobile) {
      return (
        <>
          <BodyClass className="is-detail" />
          <main className="m-safe m-safe--detail" role="main" aria-label="Skill 详情（移动端）">
            <MobileDetailCardSkeleton />
            <div style={{ height: 12 }} />
            <div className="m-grid" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <MobilePracticeCardSkeleton key={`m-detail-practice-skeleton-${index}`} index={index} />
              ))}
            </div>
          </main>
        </>
      );
    }
    return (
      <>
        <BodyClass className="is-detail" />
        <SkillDetailSkeleton />
      </>
    );
  }

  // 移动端详情页：使用 mockup 对齐的“简化布局”（以关联实践列表为主）。
  if (isMobile) {
    const title = skill?.name || "未找到";
    const desc = skill?.description || "";
    const skillTag = skill?.tag || "-";

    const hasMore = practicePage < (practiceTotalPages || 1);
    const showFirstPageSkeleton = practiceLoading && practicePage === 1;
    const loadingMore = practiceLoading && practicePage > 1;

    return (
      <>
        <BodyClass className="is-detail" />

        <main className="m-safe m-safe--detail" role="main" aria-label="Skill 详情（移动端）">
          {/* Skill 信息卡：移动端纵向排布 */}
          <section aria-label="Skill 信息">
            <article className="m-detail-card">
              <div className="m-detail-card__top">
                <span className="m-pill" aria-label={`分类 ${skillTag}`}>
                  <Tag className="icon" aria-hidden="true" />
                  {skillTag}
                </span>
                <span className="m-pill m-pill--heat" aria-label={`热度 ${formatHeat(skill?.heat_score)}`}>
                  <Flame className="icon" aria-hidden="true" />
                  {formatHeat(skill?.heat_score)}
                </span>
              </div>

              {/* v1.3.0：技能包标识（is_package=true 时展示「技能包」Label） */}
              <div className="m-detail-card__title-row">
                <h1 className="m-detail-card__title">{title}</h1>
                {skill?.is_package ? (
                  <span className="m-badge m-badge--package" aria-label="技能包">
                    技能包
                  </span>
                ) : null}
              </div>
              <p className="m-detail-card__desc">{desc}</p>

              {/* PC 专属能力：移动端降级为 toast 提示 */}
              <div className="m-detail-card__actions" aria-label="操作区">
                <button className="m-detail-btn m-detail-btn--primary" type="button" onClick={handleDownload}>
                  下载 ZIP
                </button>
                <button className="m-detail-btn" type="button" onClick={handleSubmitPractice}>
                  投稿实践
                </button>
              </div>
            </article>
          </section>

          <section className="m-detail-heading" aria-label="关联实践标题">
            <h2 className="m-detail-heading__title">关联实践</h2>
          </section>

          {/* 关联实践：两列网格 + 无限滚动 */}
          <section className="m-grid" aria-label="关联实践列表" aria-busy={practiceLoading}>
            {practiceError ? (
              <div className="m-feed-state" role="status" aria-label="加载失败">
                <div className="m-feed-state__title">加载失败</div>
                <div className="m-feed-state__desc">{practiceError}</div>
                <button
                  className="m-retry"
                  type="button"
                  onClick={() => setPracticeReloadKey((key) => key + 1)}
                  aria-label="重试加载关联实践"
                >
                  <RefreshCcw className="icon" aria-hidden="true" />
                  重试
                </button>
              </div>
            ) : showFirstPageSkeleton ? (
              Array.from({ length: 4 }).map((_, index) => (
                <MobilePracticeCardSkeleton key={`m-detail-practice-skeleton-${index}`} index={index} />
              ))
            ) : practices.length === 0 ? (
              <div className="m-feed-state" role="status" aria-label="暂无实践">
                <div className="m-feed-state__title">暂无实践</div>
                <div className="m-feed-state__desc">稍后再来看看，或在 PC 端投稿你的实践。</div>
              </div>
            ) : (
              practices.map((practice) => {
                const pTitle = practice.title || "-";
                const summaryText = (practice.summary || "").replace(/\\n/g, "\n").replace(/\r?\n/g, " ").trim();
                const author = practice.author_name?.trim();
                // 需求：移动端 Skill 详情页「关联实践」卡片作者处仅展示作者名（不展示渠道名）
                const sourceText = author || "-";

                return (
                  <a
                    key={practice.id}
                    className="m-card m-card--practice"
                    href={practice.source_url || "#"}
                    target={practice.source_url ? "_blank" : undefined}
                    rel={practice.source_url ? "noreferrer noopener" : undefined}
                    aria-label={`打开原文：${pTitle}`}
                    aria-disabled={!practice.source_url}
                    onClick={(event) => {
                      if (!practice.source_url) {
                        event.preventDefault();
                        return;
                      }
                      handlePracticeClick(practice);
                    }}
                  >
                    <div className="m-practice__title">{pTitle}</div>
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
                  </a>
                );
              })
            )}
          </section>

          {/* 无限滚动哨兵 */}
          <div ref={practiceSentinelRef} className="m-sentinel" aria-hidden="true" />

          <div className="m-feed-footer" aria-label="列表状态">
            {loadingMore ? (
              <div className="m-feed-footer__loading" aria-label="加载中">
                加载中…
              </div>
            ) : practiceError ? (
              <button
                className="m-feed-footer__retry"
                type="button"
                onClick={() => setPracticeReloadKey((key) => key + 1)}
                aria-label="重试加载"
              >
                <RefreshCcw className="icon" aria-hidden="true" />
                重试
              </button>
            ) : !showFirstPageSkeleton && !hasMore && practices.length > 0 ? (
              <div className="m-feed-footer__end" aria-label="已到底">
                已到底
              </div>
            ) : null}
          </div>
        </main>

        {/* Toast：用于移动端提示“请前往PC版网页使用功能” */}
        <div className="m-toast" role="status" aria-live="polite" data-visible={toastVisible ? "true" : "false"}>
          {toastMessage}
        </div>
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
              {/* v1.3.0：技能包标识（is_package=true 时展示「技能包」Label） */}
              {!skillLoading && skill?.is_package ? (
                <span className="tag tag--package detail-hero__package" aria-label="技能包">
                  技能包

                  {/*
                    技能包问号提示（仅桌面端）：
                    - 需求：问号需要“包含在技能包 label 内”，避免作为独立元素导致断行/错位
                    - 交互：hover / focus-visible 时展示气泡；移动端不做该交互（移动端使用独立布局，不渲染此段）
                  */}
                  <button className="tag__help" type="button" aria-label="技能包说明" aria-describedby={packageHelpId}>
                    <CircleHelp className="icon" aria-hidden="true" />
                    <span className="tag__tooltip" id={packageHelpId} role="tooltip">
                      包含数个子技能
                    </span>
                  </button>
                </span>
              ) : null}
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
              href={repoHomeUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="打开仓库主页"
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
              <div className="detail-panel__download" data-unsupported={!supportsDownloadZip}>
                {/* v1.4.0：npx 指令下载（仅 PC）
                    - 需求：npx 区块在“下载 ZIP”入口上方
                    - 视觉：不展示额外标题/外层容器，只展示命令框 + 复制图标 */}
                {npxCommand ? (
                  <div className="detail-panel__npx" aria-label="npx 下载指令">
                    <div className="detail-panel__npx-scroll" aria-label="npx 命令（可选中复制）">
                      <code className="detail-panel__npx-code">{npxCommand}</code>
                    </div>
                    <button
                      className="detail-panel__npx-copy"
                      type="button"
                      onClick={handleCopyNpxCommand}
                      data-state={npxCopyState}
                      aria-label="复制 npx 下载指令"
                      title={npxCopyState === "error" ? "复制失败，请手动复制" : "复制"}
                    >
                      {npxCopyState === "copied" ? (
                        <Check className="icon" aria-hidden="true" />
                      ) : (
                        <Copy className="icon" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                ) : null}

                {/* 不支持 ZIP 下载时，按钮改为白色外链，并把问号图标放进按钮内 */}
                {supportsDownloadZip ? (
                  <button
                    className="btn btn--primary btn--download detail-panel__download-btn"
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
                ) : (
                  <a
                    className="btn btn--download btn--download-alt detail-panel__download-btn detail-panel__download-btn--with-help"
                    href={repoHomeUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-describedby={downloadHelpId}
                  >
                    <span className="detail-panel__download-main">
                      <Github className="icon" />
                      <span className="btn__label">前往官网下载</span>
                    </span>
                    <span className="detail-panel__download-help-inline" aria-hidden="true">
                      <CircleHelp className="icon" />
                      <span className="detail-panel__download-tooltip" id={downloadHelpId} role="tooltip">
                        该skill暂不支持直接下载skill包，请参考官方文档进行下载
                      </span>
                    </span>
                  </a>
                )}
              </div>
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
                  {docTitle}
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
              {(() => {
                const hasMore = practicePage < (practiceTotalPages || 1);
                const showFirstPageSkeleton = practiceLoading && practicePage === 1;
                const loadingMore = practiceLoading && practicePage > 1;

                // 触底加载的手动兜底：当用户不希望等自动触发时，可点击“加载更多”。
                const handleLoadMore = () => {
                  if (!hasMore) return;
                  if (practiceLoading) return;
                  if (practiceError) return;
                  if (practiceLoadMoreLockedRef.current) return;
                  practiceLoadMoreLockedRef.current = true;
                  setPracticePage((prev) => prev + 1);
                };

                if (practiceError && practicePage <= 1) {
                  return (
                    <div className="empty-state" role="status" aria-label="加载失败">
                      加载失败：{practiceError}
                      <button
                        className="pagination__btn"
                        type="button"
                        style={{ marginLeft: 10 }}
                        onClick={() => setPracticeReloadKey((key) => key + 1)}
                        aria-label="重试加载实践列表"
                      >
                        重试
                      </button>
                    </div>
                  );
                }

                if (showFirstPageSkeleton) {
                  return (
                    <div className="practice-grid" aria-busy="true">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <PracticeCardSkeleton key={`practice-skeleton-${index}`} />
                      ))}
                    </div>
                  );
                }

                if (practices.length === 0) {
                  return <div className="empty-state">暂无实践</div>;
                }

                return (
                  <>
                    <div className="practice-grid">
                      {practices.map((practice, index) => {
                        const accent = PRACTICE_ACCENTS[index % PRACTICE_ACCENTS.length];
                        // 作者名/渠道名可能为空：统一 trim 后组合展示，保证 UI 始终有可读内容。
                        const channelName = practice.channel?.trim();
                        const authorName = practice.author_name?.trim();
                        // 同时存在时用“渠道·作者”格式；否则回退到任一可用值，最后兜底为 "-"。
                        const sourceText =
                          channelName && authorName ? `${channelName}·${authorName}` : channelName || authorName || "-";
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
                                <Eye className="icon" />
                                {formatCompactNumber(practice.click_count)}
                              </span>
                              {/* 实践卡片底部元信息：展示“渠道·作者”，更符合来源信息语义。 */}
                              <span className="meta" aria-label={`来源 ${sourceText}`} title={sourceText}>
                                <User className="icon" />
                                {sourceText}
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>

                    {/* 触底哨兵：PC 端实践列表也启用无限滚动加载 */}
                    <div ref={practiceSentinelRef} className="practice-sentinel" aria-hidden="true" />

                    {/* 列表底部状态（loading / error / end / manual-loadmore） */}
                    <div className="practice-feed-footer" aria-label="实践列表状态">
                      {practiceError ? (
                        <button className="pagination__btn" type="button" onClick={() => setPracticeReloadKey((key) => key + 1)}>
                          重试加载
                        </button>
                      ) : loadingMore ? (
                        <div className="practice-feed-footer__loading" aria-label="加载中">
                          加载中…
                        </div>
                      ) : hasMore ? (
                        <button className="pagination__btn" type="button" onClick={handleLoadMore} aria-label="加载更多实践">
                          加载更多
                        </button>
                      ) : (
                        <div className="practice-feed-footer__end" aria-label="已到底">
                          已到底
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </section>

            <section className="detail-card detail-tabpanel detail-tabpanel--skillmd" aria-label={`${docTitle} 内容区`}>
              <header className="section-header">
                <h2>{docTitle}</h2>
                <a className="btn btn--ghost btn--sm" href={docSourceUrl} target="_blank" rel="noreferrer">
                  前往 Source
                </a>
              </header>

              <article className="markdown">
                {!skill?.markdown ? (
                  <p>未找到 {docTitle}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    urlTransform={urlTransform}
                  >
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
