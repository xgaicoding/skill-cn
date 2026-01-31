import DetailPage from "@/components/detail/DetailPage";
import { headers } from "next/headers";
import { detectDeviceKindFromUA } from "@/lib/device";

export default function Page({ params }: { params: { id: string } }) {
  /**
   * 详情页同样需要区分移动端 View：
   * - mobile：使用移动端专属布局（信息纵向排布 + 关联实践两列无限滚动）
   * - tablet/desktop：保持现有桌面详情页逻辑
   */
  const ua = headers().get("user-agent") || "";
  const deviceKind = detectDeviceKindFromUA(ua);

  return <DetailPage id={params.id} deviceKind={deviceKind} />;
}
