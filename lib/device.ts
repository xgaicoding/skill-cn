/**
 * 设备类型判断（仅用于展示层）
 * ------------------------------------------------------------
 * 需求背景（v1.2.0 Mobile Web）：
 * - 我们需要在「首页/详情页」为移动端渲染一套完全不同的 UI/交互
 * - 若仅靠客户端 window.innerWidth 判断，会出现：
 *   1) SSR 首屏先渲染 Desktop 结构
 *   2) Hydration 后再切到 Mobile，导致“闪一下/布局跳动”
 *
 * 解决思路：
 * - 在 Server Component 读取 user-agent 做一次“粗粒度”判断（mobile/tablet/desktop）
 * - 首屏用该结果选择 View，避免闪烁
 *
 * 注意：
 * - UA 判断永远不可能 100% 准确（也不适合做安全逻辑），这里只用于“展示策略”
 * - Tablet 本期按 Desktop 处理（避免扩大范围）；若后续需要，再针对 tablet 做精细化适配
 */

export type DeviceKind = "mobile" | "tablet" | "desktop";

export function detectDeviceKindFromUA(userAgent: string): DeviceKind {
  // 兜底：空 UA 直接按 desktop 处理（本地测试/爬虫等场景更稳）。
  const ua = (userAgent || "").toLowerCase();

  /**
   * 规则设计（尽量保守）：
   * - 手机：明确命中 iPhone/iPod/Android Mobile/Windows Phone
   * - 平板：iPad 或 Android 非 Mobile（例如部分平板 UA 不带 "mobile"）
   * - 其他：默认 desktop
   *
   * 说明：
   * - 不做更细碎的机型识别，避免“越写越不准”
   * - 若误判：CSS 断点仍会保证“不溢出/可操作”，只是 View 选择可能不完美
   */
  if (/(iphone|ipod|android.*mobile|windows phone)/i.test(ua)) {
    return "mobile";
  }

  if (/(ipad|android(?!.*mobile))/i.test(ua)) {
    return "tablet";
  }

  return "desktop";
}

