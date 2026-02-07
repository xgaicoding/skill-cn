import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { headers } from "next/headers";
import { detectDeviceKindFromUA } from "@/lib/device";
import { PAGE_SIZE } from "@/lib/constants";
import type { Skill } from "@/lib/types";
import { fetchSkillList } from "@/lib/data/skills";

type HomeSearchParams = {
  /**
   * 首页 query：
   * - q/tag/sort/mode：既有参数
   * - ids：用于“从实践卡片筛选相关 Skill”场景（展示指定 id 列表的 Skill 卡片）
   *   例：/?ids=1,2,3
   */
  q?: string;
  tag?: string;
  sort?: string;
  mode?: string;
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
  const q = params.q;
  const ids = params.ids;

  const isDefaultTag = !tag || tag === "全部";
  const isDefaultSort = !sort || sort === "heat";
  const isDefaultMode = !mode || mode === "skills";

  return !q && !ids && isDefaultTag && isDefaultSort && isDefaultMode;
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: HomeSearchParams;
}): Promise<Metadata> {
  const shouldIndex = isDefaultHomeParams(searchParams);

  return {
    // 首页 canonical 固定为根路径，避免 query 参数造成重复内容。
    alternates: {
      canonical: "/",
    },
    // 带筛选/搜索的参数页统一 noindex，避免收录空壳页面。
    robots: shouldIndex
      ? undefined
      : {
          index: false,
          follow: true,
        },
  };
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

  return (
    <HomePage
      initial={searchParams || {}}
      deviceKind={deviceKind}
      initialSkills={initialSkillsPayload?.skills}
      initialTotalPages={initialSkillsPayload?.totalPages}
    />
  );
}
