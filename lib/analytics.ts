import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * 埋点系统核心逻辑
 * ------------------------------------------------------------
 * 职责：
 * - 封装埋点逻辑，统一事件上报接口
 * - 生成和管理 session_id
 * - 收集页面和设备信息
 * - 错误处理（埋点失败不影响功能）
 */

/**
 * 获取或生成 session_id（浏览器会话级别）
 * - 存储在 sessionStorage 中
 * - 浏览器关闭后失效
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    let sessionId = sessionStorage.getItem("skillhub_analytics_session_id");
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("skillhub_analytics_session_id", sessionId);
    }
    return sessionId;
  } catch {
    // sessionStorage 不可用时，生成临时 session_id（不持久化）
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 获取设备类型
 */
function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(ua);

  if (isTablet) return "tablet";
  if (isMobile) return "mobile";
  return "desktop";
}

/**
 * 埋点事件上报
 * @param eventName 事件名称
 * @param properties 事件属性（可选）
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      // Supabase 客户端不可用时，静默失败
      return;
    }

    await supabase.from("analytics_events").insert({
      event_name: eventName,
      properties: properties || {},
      session_id: getSessionId(),
      page_url: window.location.href,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
    });
  } catch (error) {
    // 埋点失败不影响功能，静默处理
    console.error("Analytics error:", error);
  }
}

/**
 * 防抖版本的埋点函数
 * - 用于高频事件（如滚动、鼠标移动等）
 * - 避免频繁调用导致性能问题
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * 防抖版本的 trackEvent
 * - 1 秒内只会触发一次
 */
export const trackEventDebounced = debounce(trackEvent, 1000);
