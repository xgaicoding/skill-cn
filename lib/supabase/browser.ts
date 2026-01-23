import { createClient } from "@supabase/supabase-js";

// 仅在浏览器侧复用同一个 Supabase 实例，避免多实例导致的会话状态不一致
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  browserClient = createClient(url, key, {
    auth: {
      // 明确使用 PKCE，确保 code_verifier/交换流程稳定
      flowType: "pkce",
      // 浏览器侧需要持久化会话，保证刷新/跳转后仍能取到登录态
      persistSession: true,
      // 自动刷新 token，避免短时间内状态失效
      autoRefreshToken: true,
      // 我们在 /auth/callback 手动处理 code，因此关闭自动解析
      detectSessionInUrl: false,
    },
  });
  return browserClient;
}
