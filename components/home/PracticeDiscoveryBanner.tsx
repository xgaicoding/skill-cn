"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { HomeMode } from "@/components/home/ModeDock";

/**
 * 实践模式引导 Banner
 * ------------------------------------------------------------
 * 设计目标：
 * - 在 skill 模式下常驻显示，引导用户发现实践模式
 * - 用户点击"立即体验"或切换到 practice 模式后，Banner 消失 + 记录 localStorage
 * - 下次访问时不再显示（说明用户已经知道实践模式了）
 * 
 * 埋点：
 * - banner_show：Banner 显示时触发
 * - banner_click：点击"立即体验"时触发
 */

interface PracticeDiscoveryBannerProps {
  mode: HomeMode;
  onTryNow: () => void;
}

export default function PracticeDiscoveryBanner({ mode, onTryNow }: PracticeDiscoveryBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 检查是否已经看过 Banner
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEYS.PRACTICE_MODE_DISCOVERED) === "1";
      if (hasSeen) {
        return;
      }

      // 显示 Banner
      setVisible(true);

      // 埋点：Banner 显示
      trackEvent("banner_show", { type: "practice_discovery" });
    } catch {
      // localStorage 不可用时，不显示 Banner
      return;
    }
  }, []);

  // 响应 mode 变化：切到 practice 模式时自动隐藏
  useEffect(() => {
    if (mode === "practices" && visible) {
      setVisible(false);
    }
  }, [mode, visible]);

  const handleTryNow = () => {
    // 埋点：点击"立即体验"
    trackEvent("banner_click", {
      type: "practice_discovery",
      action: "try_now",
    });

    // 关闭 Banner
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEYS.PRACTICE_MODE_DISCOVERED, "1");
    } catch {
      // localStorage 不可用时，静默失败
    }

    // 触发父组件回调（切换到实践模式）
    onTryNow();
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className="practice-discovery-banner"
      role="banner"
      aria-label="实践模式引导"
    >
      <div className="practice-discovery-banner__content">
        <div className="practice-discovery-banner__icon">
          <Sparkles className="icon" aria-hidden="true" />
        </div>
        <div className="practice-discovery-banner__text">
          <h2 className="practice-discovery-banner__title">
            发现实践案例，看看别人怎么用
          </h2>
          <p className="practice-discovery-banner__description">
            真实案例 + 实战方案，帮你快速上手新工具
          </p>
        </div>
        <button
          className="btn btn--primary btn--sm practice-discovery-banner__cta"
          onClick={handleTryNow}
          aria-label="立即体验实践模式"
        >
          立即体验
        </button>
      </div>
    </div>
  );
}
