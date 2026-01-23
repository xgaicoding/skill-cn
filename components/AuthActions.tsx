"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogIn, LogOut, Plus } from "lucide-react";
import { ISSUE_REPO_URL } from "@/lib/constants";
import { signInWithGitHub, useAuthUser } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { usePathname } from "next/navigation";
import { Loading } from "@/components/Loading";

export default function AuthActions() {
  const { user, loading } = useAuthUser();
  const pathname = usePathname();
  const avatarUrl =
    (user?.user_metadata as { avatar_url?: string; avatarUrl?: string } | undefined)?.avatar_url ??
    (user?.user_metadata as { avatar_url?: string; avatarUrl?: string } | undefined)?.avatarUrl ??
    "";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // 标记当前按钮的“接口调用中”状态，避免用户感知为无响应。
  const [pendingAction, setPendingAction] = useState<"submit" | "login" | "logout" | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const handleSubmit = async () => {
    if (user) {
      window.open(ISSUE_REPO_URL, "_blank", "noreferrer");
      return;
    }
    // 未登录时走 OAuth，需要给按钮一个明确的过渡态。
    setPendingAction("submit");
    try {
      await signInWithGitHub(ISSUE_REPO_URL);
    } finally {
      setPendingAction(null);
    }
  };

  const handleLogin = async () => {
    if (user) return;
    // 登录按钮同样走 OAuth，避免点击后“静默等待”的错觉。
    setPendingAction("login");
    try {
      await signInWithGitHub(window.location.href);
    } finally {
      setPendingAction(null);
    }
  };

  const toggleUserMenu = () => {
    if (!user) return;
    setUserMenuOpen((open) => !open);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    // 退出会触发 Supabase 请求，增加过渡态避免无反馈。
    setPendingAction("logout");
    try {
      await supabase.auth.signOut();
    } finally {
      setPendingAction(null);
    }
  };

  useEffect(() => {
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (userMenuRef.current?.contains(target)) return;
      setUserMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <>
      <button
        className="ghost"
        type="button"
        onClick={handleSubmit}
        disabled={loading || pendingAction === "submit"}
        aria-label="提交 Skill"
        // data-loading 触发按钮内部 Loading 与渐变扫光效果。
        data-loading={pendingAction === "submit"}
        aria-busy={pendingAction === "submit"}
      >
        <Plus className="icon" aria-hidden="true" />
        <span className="btn__label">Skill</span>
        <span className="btn__loading" aria-hidden="true">
          <Loading variant="dots" sizePx={14} />
        </span>
      </button>
      {user ? (
        <div className="user-menu" ref={userMenuRef} data-open={userMenuOpen ? "true" : "false"}>
          <button
            type="button"
            className="user-avatar-btn"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-controls="user-menu-panel"
            onClick={toggleUserMenu}
            disabled={loading}
          >
            {avatarUrl ? (
              <img className="user-avatar" src={avatarUrl} alt="用户头像" referrerPolicy="no-referrer" />
            ) : (
              <div className="user-avatar user-avatar--placeholder" aria-hidden="true" />
            )}
            <span className="user-avatar__chevron" aria-hidden="true">
              <ChevronDown className="icon" />
            </span>
          </button>
          <div className="user-menu__panel" id="user-menu-panel" role="menu" aria-label="用户菜单">
            <button
              type="button"
              className="user-menu__item"
              role="menuitem"
              onClick={handleLogout}
              disabled={pendingAction === "logout"}
              data-loading={pendingAction === "logout"}
              aria-busy={pendingAction === "logout"}
            >
              <LogOut className="icon" aria-hidden="true" />
              <span className="btn__label">退出</span>
              <span className="btn__loading" aria-hidden="true">
                <Loading variant="dots" sizePx={12} />
              </span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="ghost ghost--soft"
          onClick={handleLogin}
          disabled={loading || pendingAction === "login"}
          data-loading={pendingAction === "login"}
          aria-busy={pendingAction === "login"}
        >
          <LogIn className="icon" aria-hidden="true" />
          <span className="btn__label">登录</span>
          <span className="btn__loading" aria-hidden="true">
            <Loading variant="dots" sizePx={14} />
          </span>
        </button>
      )}
    </>
  );
}
