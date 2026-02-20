import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { headers } from "next/headers";
import { detectDeviceKindFromUA } from "@/lib/device";
import { PAGE_SIZE } from "@/lib/constants";
import type { BoardEntry, HomeMetrics, Practice, Skill } from "@/lib/types";
import { fetchSkillList } from "@/lib/data/skills";
import {
  fetchHomeFeaturedPractices,
  fetchHomeHotBoardEntries,
  fetchHomeMetricsSnapshot,
} from "@/lib/data/home-retention";

type HomeSearchParams = {
  /**
   * 首页 query：
   * - q/tag/sort/mode：既有参数
   * - window：实践模式时间窗口筛选（当前仅 7d）
   * - ids：用于“从实践卡片筛选相关 Skill”场景（展示指定 id 列表的 Skill 卡片）
   *   例：/?ids=1,2,3
   */
  q?: string;
  tag?: string;
  sort?: string;
  mode?: string;
  window?: string;
  ids?: string;
};

/**
 * 判断是否为“默认首页”（无筛选/无搜索/无特殊模式）：
 * - 只有默认首页才进行 SSR 预取，避免与带参数页面产生内容不一致
 */
const isDefaultHomeParams = (params?: HomeSearchParams) => {
  if (!params) return true;
  const tag = params.tag;
  const sort = params.sort;
  const mode = params.mode;
  const windowParam = params.window;
  const q = params.q;
  const ids = params.ids;

  const isDefaultTag = !tag || tag === "全部";
  const isDefaultSort = !sort || sort === "heat";
  const isDefaultMode = !mode || mode === "skills";

  return !q && !ids && !windowParam && isDefaultTag && isDefaultSort && isDefaultMode;
};

/**
 * 首页首屏预取（仅默认首页）：
 * - 复用 /api/skills 的统一查询逻辑，避免口径漂移
 * - 保证爬虫能拿到真实内容，同时减少重复维护成本
 */
const fetchInitialSkills = async () => {
  try {
    const payload = await fetchSkillList({
      page: 1,
      size: PAGE_SIZE,
      sort: "heat",
    });

    return {
      skills: payload.data,
      totalPages: payload.totalPages,
    };
  } catch {
    // 兜底：SSR 失败不阻塞页面渲染，交给客户端继续拉取
    return {
      skills: [] as Skill[],
      totalPages: 1,
    };
  }
};

/**
 * 首页首屏“更新看板”预取（仅默认首页 + PC）：
 * - featured：每周精选（左侧榜单数据）
 * - hotEntries：热门榜单（右侧 Tab 数据）
 * - metrics：4 项 KPI
 *
 * 注意：
 * - 这里是 SEO 关键数据，失败时降级为空数组/null，避免阻断页面渲染
 * - 客户端仍会在 hydration 后按既有逻辑刷新，保证交互一致
 */
const fetchInitialHomeRetentionData = async () => {
  try {
    const [featured, hotEntries, metrics] = await Promise.all([
      fetchHomeFeaturedPractices(),
      fetchHomeHotBoardEntries(9),
      fetchHomeMetricsSnapshot(),
    ]);

    return {
      featured,
      hotEntries,
      metrics,
    };
  } catch {
    // 兜底：任何异常都不影响首页可用性。
    return {
      featured: [] as Practice[],
      hotEntries: [] as BoardEntry[],
      metrics: null as HomeMetrics | null,
    };
  }
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: HomeSearchParams;
}): Promise<Metadata> {
  const shouldIndex = isDefaultHomeParams(searchParams);
  const mode = searchParams?.mode || "skills";
  const hasQuery = Boolean(searchParams?.q);
  const hasTag = Boolean(searchParams?.tag && searchParams.tag !== "全部");

  /**
   * 首页标题/描述策略：
   * - 默认首页：强调品牌 + 核心价值（可索引）
   * - 参数页（搜索/筛选/模式）：给用户更清晰语义，但保持 noindex，防止薄页收录
   */
  let title = "Skill Hub 中国 - 实战 Skill 案例与可复用方案库";
  let description = "聚合真实 Skill 实战案例与可复用方案，帮助你更快找到能用、好用、可复用的工作流。";

  if (!shouldIndex) {
    if (mode === "practices") {
      title = "实践案例广场 - Skill Hub 中国";
      description = "浏览本周上新与热门实践案例，快速复用可落地的 Skill 方案。";
    } else if (hasQuery) {
      title = "搜索结果 - Skill Hub 中国";
      description = "按关键词快速筛选 Skill 与实战案例，定位与你场景最匹配的方案。";
    } else if (hasTag) {
      title = "分类筛选 - Skill Hub 中国";
      description = "按分类浏览 Skill 实战内容，快速发现高相关的工具与案例。";
    }
  }

  const metadata: Metadata = {
    title,
    description,
    keywords: ["Skill Hub", "Skill 中国", "AI Skill 实战", "工作流自动化", "工具选型", "Claude"],
    // 首页 canonical 固定为根路径，避免 query 参数造成重复内容。
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: "/",
      type: "website",
      images: [{ url: "/og-cover.png", alt: "Skill Hub 中国首页分享图" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-cover.png"],
    },
    // 带筛选/搜索的参数页统一 noindex，避免收录空壳页面。
    robots: shouldIndex
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: true,
        },
  };

  return metadata;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: HomeSearchParams;
}) {
  /**
   * 通过 UA 做一次“展示层”设备类型判断（避免移动端首屏闪 Desktop）。
   * - mobile：渲染移动端专属 View
   * - tablet/desktop：本期均按桌面 View 处理
   */
  const ua = headers().get("user-agent") || "";
  const deviceKind = detectDeviceKindFromUA(ua);

  const shouldPrefetch = isDefaultHomeParams(searchParams);
  const initialSkillsPayload = shouldPrefetch ? await fetchInitialSkills() : null;
  /**
   * 首屏更新看板 SSR 条件：
   * - 仅默认首页（可索引页）做服务端预取，最大化 SEO 收益
   * - 本期仅改 PC，移动端保持现状，避免增加不必要查询
   */
  const shouldPrefetchHomeRetention = shouldPrefetch && deviceKind !== "mobile";
  const initialHomeRetentionPayload = shouldPrefetchHomeRetention ? await fetchInitialHomeRetentionData() : null;

  return (
    <HomePage
      initial={searchParams || {}}
      deviceKind={deviceKind}
      initialSkills={initialSkillsPayload?.skills}
      initialTotalPages={initialSkillsPayload?.totalPages}
      initialFeatured={initialHomeRetentionPayload?.featured}
      initialHotBoardEntries={initialHomeRetentionPayload?.hotEntries}
      initialHomeMetrics={initialHomeRetentionPayload?.metrics}
    />
  );
}
