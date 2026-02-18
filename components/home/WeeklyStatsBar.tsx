"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { WeeklyStats } from "@/lib/types";

type WeeklyStatsBarProps = {
  /**
   * 点击“本周上新 X 篇”时由父组件接管：
   * - 切换到实践模式
   * - 强制按“最新”排序
   */
  onOpenWeeklyPractices: () => void;
  /**
   * 样式修饰类：
   * - PC 使用默认样式
   * - 移动端通过额外 class 做尺寸/间距覆盖
   */
  className?: string;
};

/**
 * WeeklyStatsBar（v1.5.7 P1）
 * ------------------------------------------------------------
 * 职责：
 * - 启动时拉取 `/api/stats/weekly`
 * - 成功：常驻展示“本周上新 + 总量”
 * - 失败：按需求整块隐藏，不影响页面其他区域
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
        // 按需求：API 失败时整块隐藏。
        if (!cancelled) {
          setHiddenByError(true);
          setStats(null);
        }
      }
    };

    fetchWeeklyStats();

    return () => {
      cancelled = true;
    };
  }, []);

  if (hiddenByError || !stats) {
    return null;
  }

  const newCount = Number(stats.newPracticesThisWeek || 0);
  const totalPractices = Number(stats.totalPractices || 0);
  const totalSkills = Number(stats.totalSkills || 0);

  return (
    <section className={`weekly-stats-bar ${className || ""}`.trim()} aria-label="本周上新统计">
      <div className="weekly-stats-bar__inner">
        {newCount > 0 ? (
          <>
            <button
              type="button"
              className="weekly-stats-bar__new-link"
              onClick={onOpenWeeklyPractices}
              aria-label={`查看本周上新，共 ${newCount} 篇`}
            >
              {/*
                使用 Lucide Sparkles 替代 emoji：
                - 与站内图标体系保持一致（统一 SVG 视觉语言）
                - 通过 CSS 统一控制橙色主视觉与 hover 反馈
              */}
              <Sparkles className="weekly-stats-bar__icon" aria-hidden="true" />
              <span className="weekly-stats-bar__new-prefix">本周上新</span>
              {/* 数字单独拆分为独立节点，方便放大并做主色高亮，拉开信息层级。 */}
              <strong className="weekly-stats-bar__new-count">{newCount}</strong>
              <span className="weekly-stats-bar__new-suffix">篇实践</span>
            </button>
            <span className="weekly-stats-bar__divider" aria-hidden="true">
              ·
            </span>
            <span className="weekly-stats-bar__meta">共收录 {totalPractices} 篇</span>
            <span className="weekly-stats-bar__divider" aria-hidden="true">
              ·
            </span>
            <span className="weekly-stats-bar__meta">{totalSkills} 个 Skill</span>
          </>
        ) : (
          <>
            <span className="weekly-stats-bar__text">本周暂无新实践</span>
            <span className="weekly-stats-bar__divider" aria-hidden="true">
              ·
            </span>
            <span className="weekly-stats-bar__meta">共收录 {totalPractices} 篇</span>
            <span className="weekly-stats-bar__divider" aria-hidden="true">
              ·
            </span>
            <span className="weekly-stats-bar__meta">{totalSkills} 个 Skill</span>
          </>
        )}
      </div>
    </section>
  );
}
