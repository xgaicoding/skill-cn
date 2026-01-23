import { Suspense } from "react";

import AuthCallbackClient from "./CallbackClient";
import AuthLoading from "./AuthLoading";

/**
 * Auth Callback Page（服务端入口）
 * -------------------------------
 * Next.js 要求：使用 `useSearchParams()` 的客户端组件必须被 `<Suspense>` 包裹，
 * 否则在 `next build` 的预渲染阶段会报错并中断构建。
 *
 * 这里的 Page 仅负责：
 * - 提供 Suspense 边界（fallback 输出统一的登录加载态）
 * - 渲染真正的客户端回调逻辑组件（AuthCallbackClient）
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthCallbackClient />
    </Suspense>
  );
}
