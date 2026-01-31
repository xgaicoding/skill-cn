import HomePage from "@/components/home/HomePage";
import { headers } from "next/headers";
import { detectDeviceKindFromUA } from "@/lib/device";

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
  /**
   * 通过 UA 做一次“展示层”设备类型判断（避免移动端首屏闪 Desktop）。
   * - mobile：渲染移动端专属 View
   * - tablet/desktop：本期均按桌面 View 处理
   */
  const ua = headers().get("user-agent") || "";
  const deviceKind = detectDeviceKindFromUA(ua);

  return <HomePage initial={searchParams || {}} deviceKind={deviceKind} />;
}
