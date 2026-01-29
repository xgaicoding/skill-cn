import HomePage from "@/components/home/HomePage";

export default function Page({
  searchParams,
}: {
  /**
   * 首页 query：
   * - q/tag/sort/mode：既有参数
   * - ids：用于“从实践卡片筛选相关 Skill”场景（展示指定 id 列表的 Skill 卡片）
   *   例：/?ids=1,2,3
   */
  searchParams?: { q?: string; tag?: string; sort?: string; mode?: string; ids?: string };
}) {
  return <HomePage initial={searchParams || {}} />;
}
