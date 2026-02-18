"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { WeeklyStats } from "@/lib/types";

type WeeklyStatsBarProps = {
  /** 点击"本周上新"时切换到实践模式 + 按最新排序 */
  onOpenWeeklyPractices: () => void;
  /** 移动端通过额外 class 做尺寸覆盖 */
  className?: string;
};

/**
 * WeeklyStatsBar（v1.5.7 P1）
 * ------------------------------------------------------------
 * 一行式统计条，融入页面背景，不抢视觉焦点。
 * API 失败时整块隐藏。
 */
export default function WeeklyStatsBar({ onOpenWeeklyPractices, className }: WeeklyStatsBarProps) {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [hiddenByError, setHiddenByError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchWeeklyStats = async () => {
      try {
        const res = await fetch("/api/stats/weekly");
        const json = (await res.json()) as WeeklyStats | { error?: string };

        if (!res.ok) {
          throw new Error((json as { error?: string })?.error || "加载失败");
        }

        if (!cancelled) {
          setStats(json as WeeklyStats);
          setHiddenByError(false);
        }
      } catch {
        if (!cancelled) {
          setHiddenByError(true);
          setStats(null);
        }
      }
    };

    fetchWeeklyStats();
    return () => { cancelled = true; };
  }, []);

  if (hiddenByError || !stats) return null;

  const newCount = Number(stats.newPracticesThisWeek || 0);
  const totalPractices = Number(stats.totalPractices || 0);
  const totalSkills = Number(stats.totalSkills || 0);

  return (
    <section className={`weekly-stats-bar ${className || ""}`.trim()} aria-label="本周上新统计">
      <div className="weekly-stats-bar__inner">
        {newCount > 0 ? (
          <>
            {/* 可点击区域：icon + 文案一体，hover 整体响应 */}
            <button
              type="button"
              className="weekly-stats-bar__new-link"
              onClick={onOpenWeeklyPractices}
              aria-label={`查看本周上新，共 ${newCount} 篇`}
            >
              <Sparkles className="weekly-stats-bar__icon" aria-hidden="true" />
              本周上新 <strong>{newCount}</strong> 篇实践
            </button>
            <span className="weekly-stats-bar__divider" aria-hidden="true">·</span>
            <span className="weekly-stats-bar__meta">共收录 {totalPractices} 篇</span>
            <span className="weekly-stats-bar__divider" aria-hidden="true">·</span>
            <span className="weekly-stats-bar__meta">{totalSkills} 个 Skill</span>
          </>
        ) : (
          <>
            <span className="weekly-stats-bar__text">本周暂无新实践</span>
            <span className="weekly-stats-bar__divider" aria-hidden="true">·</span>
            <span className="weekly-stats-bar__meta">共收录 {totalPractices} 篇</span>
            <span className="weekly-stats-bar__divider" aria-hidden="true">·</span>
            <span className="weekly-stats-bar__meta">{totalSkills} 个 Skill</span>
          </>
        )}
      </div>
    </section>
  );
}
