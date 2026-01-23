"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import AuthLoading from "./AuthLoading";

/**
 * AuthCallbackClient（客户端组件）
 * --------------------------------
 * 为什么需要单独拆出来？
 * - Next.js 在 build / 预渲染阶段会对使用 `useSearchParams()` 的页面做校验。
 * - 官方建议：将读取 searchParams 的逻辑放到 Client Component 中，并由 Page 用 `<Suspense>` 包裹。
 *   否则会出现：`useSearchParams() should be wrapped in a suspense boundary` 的构建报错。
 *
 * 该组件职责：
 * - 读取 GitHub OAuth 回调参数：`code` 与可选的 `next`
 * - 交换 session（supabase.auth.exchangeCodeForSession）
 * - 最终跳转到 `next`（默认 `/`）
 */
export default function AuthCallbackClient() {
  const searchParams = useSearchParams();

  /**
   * React StrictMode 下（dev 环境）effect 会触发两次：
   * - 我们用 ref 做一次性门闩，避免重复 exchange code 导致的异常/闪跳。
   */
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const supabase = getSupabaseBrowserClient();
    /**
     * 兼容性兜底：
     * - 在 Next 的类型定义里，`useSearchParams()` 可能被标注为 `ReadonlyURLSearchParams | null`
     * - 为了让严格模式（strict）下的类型检查通过，这里做一次可空处理
     */
    const code = searchParams?.get("code");
    const next = searchParams?.get("next") || "/";

    const run = async () => {
      try {
        // 没有 code 时：直接跳回目标页，避免用户卡在回调页。
        if (!code || !supabase) return;
        await supabase.auth.exchangeCodeForSession(code);
      } catch {
        // ignore：登录失败时也继续跳转（由目标页再提示/引导即可）
      } finally {
        window.location.replace(next);
      }
    };

    run();
  }, [searchParams]);

  // 视觉上使用统一的登录加载态，避免回调页出现突兀的空状态卡片。
  return <AuthLoading />;
}
