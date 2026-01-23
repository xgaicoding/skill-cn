import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * 获取一个“强制不走 Next.js Data Cache”的 Supabase Server Client。
 *
 * 背景：
 * - 在 Next.js App Router 下，`fetch` 默认可能进入 Next Data Cache（即使你没有显式写缓存逻辑）
 * - supabase-js 内部会使用全局 `fetch` 发起请求；如果该 `fetch` 被 Next 包装并默认缓存，
 *   就会出现“Supabase 数据已更新，但接口仍返回旧数据”的现象
 *
 * 方案：
 * - 通过给 Supabase client 注入自定义 `fetch`，强制每次请求都带 `cache: "no-store"`
 * - 这样可以从根源绕过 Next 的请求缓存（对 GET/HEAD 特别有效）
 *
 * 说明：
 * - 仅用于需要强一致“实时数据”的接口（例如精选位、实时榜单等）
 * - 其他接口如需缓存（提速/降压），应继续使用 `getSupabaseServerClient` 并在路由层做 revalidate
 */
export function getSupabaseServerClientNoStore() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      /**
       * 注意：这里必须使用全局 `fetch`（由 Next.js 注入/patch 的版本），
       * 但我们显式设置 `cache: "no-store"`，确保不会写入 Next Data Cache。
       */
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...(init || {}),
          cache: "no-store",
        });
      },
    },
  });
}
