import type { Metadata } from "next";
import { Suspense } from "react";
import HomePage from "@/components/home/HomePage";
import { PAGE_SIZE } from "@/lib/constants";
import type { BoardEntry, HomeMetrics, Practice, Skill } from "@/lib/types";
import { fetchSkillList } from "@/lib/data/skills";
import {
  fetchHomeFeaturedPractices,
  fetchHomeHotBoardEntries,
  fetchHomeMetricsSnapshot,
} from "@/lib/data/home-retention";

/**
 * 首页 ISR 缓存：
 * - 每 60 秒重新生成一次静态页面
 * - 不使用 searchParams/headers 等动态 API，确保 ISR 真正生效
 * - Vercel CDN 缓存后 TTFB 可降到 <100ms
 */
export const revalidate = 60;

/**
 * 首页首屏预取：
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
    return {
      skills: [] as Skill[],
      totalPages: 1,
    };
  }
};

/**
 * 首页首屏"更新看板"预取：
 * - featured：每周精选
 * - hotEntries：热门榜单
 * - metrics：4 项 KPI
 */
const fetchInitialHomeRetentionData = async () => {
  try {
    const [featured, hotEntries, metrics] = await Promise.all([
      fetchHomeFeaturedPractices(),
      fetchHomeHotBoardEntries(9),
      fetchHomeMetricsSnapshot(),
    ]);

    return { featured, hotEntries, metrics };
  } catch {
    return {
      featured: [] as Practice[],
      hotEntries: [] as BoardEntry[],
      metrics: null as HomeMetrics | null,
    };
  }
};

/**
 * 静态 Metadata（不依赖 searchParams）：
 * - 首页 canonical 固定为根路径
 * - 带参数的页面（搜索/筛选）由客户端组件在 document.title 里更新
 * - 不使用 searchParams 避免触发动态渲染
 */
export const metadata: Metadata = {
  title: "Skill Hub 中国 - 实战 Skill 案例与可复用方案库",
  description:
    "聚合真实 Skill 实战案例与可复用方案，帮助你更快找到能用、好用、可复用的工作流。",
  keywords: [
    "Skill Hub",
    "Skill 中国",
    "AI Skill 实战",
    "工作流自动化",
    "工具选型",
    "Claude",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Skill Hub 中国 - 实战 Skill 案例与可复用方案库",
    description:
      "聚合真实 Skill 实战案例与可复用方案，帮助你更快找到能用、好用、可复用的工作流。",
    url: "/",
    type: "website",
    images: [{ url: "/og-cover.png", alt: "Skill Hub 中国首页分享图" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Hub 中国 - 实战 Skill 案例与可复用方案库",
    description:
      "聚合真实 Skill 实战案例与可复用方案，帮助你更快找到能用、好用、可复用的工作流。",
    images: ["/og-cover.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * 首页 Server Component：
 * - 不接收 searchParams（避免动态渲染，确保 ISR 生效）
 * - SSR 输出默认首页内容（Skill 列表 + 看板数据）
 * - 客户端 HomePage 组件通过 useSearchParams() 读取 URL 参数，
 *   自动切换到搜索/筛选/模式状态
 */
export default async function Page() {
  const initialSkillsPayload = await fetchInitialSkills();
  const initialHomeRetentionPayload = await fetchInitialHomeRetentionData();

  return (
    <Suspense fallback={null}>
      <HomePage
        initial={{}}
        deviceKind="desktop"
        initialSkills={initialSkillsPayload.skills}
        initialTotalPages={initialSkillsPayload.totalPages}
        initialFeatured={initialHomeRetentionPayload.featured}
        initialHotBoardEntries={initialHomeRetentionPayload.hotEntries}
        initialHomeMetrics={initialHomeRetentionPayload.metrics}
      />
    </Suspense>
  );
}
