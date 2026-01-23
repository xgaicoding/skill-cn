"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function buildRedirectUrl(nextUrl: string) {
  const base = window.location.origin;
  const encoded = encodeURIComponent(nextUrl);
  return `${base}/auth/callback?next=${encoded}`;
}

export async function signInWithGitHub(nextUrl: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    alert("Supabase 未配置，无法发起 GitHub 登录");
    return;
  }
  const redirectTo = buildRedirectUrl(nextUrl);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo },
  });
  if (error) {
    alert(`登录失败：${error.message}`);
  }
}

export function useAuthUser() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      if (!supabase) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      // 先读取本地 session，避免仅依赖网络请求导致状态不稳定
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        if (isMounted) {
          setUser(sessionData.session.user);
          setLoading(false);
        }
        return;
      }

      // 再兜底请求一次用户信息，确保 token 可用时能恢复登录态
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setUser(data.user || null);
        setLoading(false);
      }
    };
    loadUser();

    if (!supabase) return () => undefined;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      // 监听登录/退出，保证 UI 及时更新
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
