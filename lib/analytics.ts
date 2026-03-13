/**
 * Google Analytics 4 自定义事件追踪
 *
 * 用法：
 *   import { trackEvent } from "@/lib/analytics";
 *   trackEvent("practice_click", { practice_id: "123", skill_name: "Cursor" });
 */

type GTagEvent = {
  action: string;
  params?: Record<string, string | number | boolean>;
};

/** 底层 gtag 调用，自动判断 window.gtag 是否可用 */
function gtag(event: GTagEvent) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  w.gtag("event", event.action, event.params);
}

/**
 * 发送自定义事件
 * @param action 事件名（snake_case）
 * @param params 事件参数
 */
export function trackEvent(action: string, params?: Record<string, string | number | boolean>) {
  gtag({ action, params });
}

// ──── 预定义事件快捷方法 ────

/** 实践案例点击 */
export function trackPracticeClick(practiceId: string | number, skillName: string) {
  trackEvent("practice_click", { practice_id: String(practiceId), skill_name: skillName });
}

/** Skill 详情页查看 */
export function trackSkillView(skillId: string | number, skillName: string) {
  trackEvent("skill_view", { skill_id: String(skillId), skill_name: skillName });
}

/** 外链跳转 */
export function trackOutboundLink(url: string, context?: string) {
  trackEvent("outbound_link", { url, context: context || "unknown" });
}

/** 站内搜索 */
export function trackSearch(searchTerm: string) {
  trackEvent("search", { search_term: searchTerm });
}

/** 首页模式切换 */
export function trackModeSwitch(mode: string) {
  trackEvent("mode_switch", { mode });
}
