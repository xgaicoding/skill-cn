"use client";

import { useMemo } from "react";
import { ExternalLink, Filter, CalendarDays, Eye } from "lucide-react";
import type { PracticeWithSkills } from "@/lib/types";
import { formatCompactNumber, formatDate } from "@/lib/format";

/**
 * 首页「实践模式」卡片
 * ------------------------------------------------------------
 * 设计目标（对齐 docs/1.1.0_article-mode/requirements.md）：
 * - 定高：同一行卡片 footer 基线对齐
 * - 标题：最多 2 行（1 行时不强行占 2 行高度）
 * - 摘要：固定 5 行高度；若超过 4 行，第 5 行做“纵向整体渐隐”；不展示 `...`
 * - 左上：channel·author（无边框容器）
 * - 右上：日历图标 + YYYY-MM-DD
 * - 左下：关联 skills（最多 3 个 +N，单行不折行，超出渐隐）
 * - 右下：眼睛图标 + 阅读量（口径与现有实践卡片一致）
 * - hover：底部上浮玻璃蒙层（不遮盖标题/摘要），提供“筛选相关 Skill / 跳转原文”
 *
 * 交互实现说明：
 * - PRD 最新口径：实践卡片本体不可点击（避免误触跳转）
 *   仅允许点击 hover 浮层中的两个操作按钮：
 *   1) “筛选相关 Skill”：新开一个首页「刷 Skill」模式 Tab，并筛出文章关联的所有 Skill 卡片
 *   2) “跳转原文”：新开原文链接
 * - 为避免“点击按钮后蒙层关不掉”（focus-within 导致），点击按钮时主动 blur 当前元素，
 *   让蒙层在鼠标移出后能正常消失。
 */

export default function PracticeFeedCard({ practice }: { practice: PracticeWithSkills }) {
  const title = practice.title || "-";
  // 将后端可能传入的 "\\n" 字面量转为真实换行，再把换行折叠为空格，避免卡片里出现“\n”字符。
  const summaryText = useMemo(() => {
    const raw = practice.summary || "";
    return raw.replace(/\\n/g, "\n").replace(/\r?\n/g, " ").trim();
  }, [practice.summary]);

  const sourceText = useMemo(() => {
    const channel = practice.channel?.trim();
    const author = practice.author_name?.trim();
    if (channel && author) return `${channel}·${author}`;
    return channel || author || "-";
  }, [practice.channel, practice.author_name]);

  // 关联技能展示（最多 3 个 +N）：API 已按 primary -> 其余顺序返回 skills。
  const totalSkillCount = Array.isArray(practice.skill_ids) ? practice.skill_ids.length : practice.skills.length;
  const displaySkills = practice.skills.slice(0, 3);
  const moreCount = Math.max(totalSkillCount - 3, 0);

  /**
   * 文章关联的所有 Skill ID：
   * - 主要使用 skill_ids（多对多真实关系）
   * - 若异常为空，则回落到 skills[].id（接口已返回轻量 skills）
   * 说明：这里会做一次去重 + 非法值过滤，避免 URL 参数污染。
   */
  const relatedSkillIds = useMemo(() => {
    const rawIds = Array.isArray(practice.skill_ids) ? practice.skill_ids : [];
    const normalized = rawIds
      .map((id) => (typeof id === "string" ? Number(id) : id))
      .filter((id) => Number.isFinite(id) && Number(id) > 0)
      .map((id) => Number(id));

    const fallback = practice.skills
      .map((skill) => skill.id)
      .filter((id) => Number.isFinite(id) && Number(id) > 0);

    // 使用 Set 去重，保持插入顺序（ES 规范保证）。
    const unique = new Set<number>(normalized.length > 0 ? normalized : fallback);
    return Array.from(unique);
  }, [practice.skill_ids, practice.skills]);

  /**
   * 点击统计（click_count）：
   * - 与 Hero/详情页保持一致：不 await，避免阻塞新标签页打开
   * - 统计失败不影响跳转
   */
  const trackClick = () => {
    fetch(`/api/practices/${practice.id}/click`, { method: "POST" }).catch(() => {
      // ignore
    });
  };

  return (
    <article className="practice-card practice-card--feed">
      <div className="practice-card__content">
        <div className="practice-card__top">
          <span className="practice-card__source" title={sourceText}>
            {sourceText}
          </span>
          <span className="practice-card__date" aria-label={`更新时间 ${formatDate(practice.updated_at)}`}>
            <CalendarDays aria-hidden="true" />
            {formatDate(practice.updated_at)}
          </span>
        </div>

        <h3 className="practice-card__title">{title}</h3>

        <p className="practice-card__summary">
          <span className="practice-card__summary-text">{summaryText}</span>
        </p>

        <div className="practice-card__bottom" aria-label="实践卡片底部信息">
          <div className="practice-card__skills" aria-label="关联技能">
            <div className="practice-card__skills-main" aria-label="技能列表">
              {displaySkills.map((skill) => (
                <span key={skill.id} className="tag" title={skill.name}>
                  {skill.name}
                </span>
              ))}
            </div>
            {moreCount > 0 ? (
              <span className="tag tag--more" aria-label={`还有 ${moreCount} 个技能`}>
                +{moreCount}
              </span>
            ) : null}
          </div>

          <span className="practice-card__read" aria-label={`阅读量 ${formatCompactNumber(practice.click_count)}`}>
            <Eye aria-hidden="true" />
            {formatCompactNumber(practice.click_count)}
          </span>
        </div>
      </div>

      {/* hover/focus 浮层：底部上浮蒙层（不遮盖标题/摘要） */}
      <div className="practice-card__overlay" role="group" aria-label="实践卡片操作">
        <button
          className="practice-action"
          type="button"
          aria-label="筛选相关 Skill"
          onClick={(event) => {
            // 阻止事件冒泡：卡片本体不可点击，但依旧保持良好习惯，避免未来加交互时误触。
            event.preventDefault();
            event.stopPropagation();

            // 修复“点击后蒙层关不掉”：按钮会获得焦点，导致 focus-within 持续为 true。
            // 这里主动 blur，让蒙层在鼠标移出后正常消失。
            (event.currentTarget as HTMLButtonElement).blur();

            if (relatedSkillIds.length === 0) {
              return;
            }

            /**
             * 方案（PRD 最新口径）：
             * - 新开首页「刷 Skill」模式 Tab
             * - 通过 URL 参数 ids=1,2,3… 在首页筛出文章关联的所有 Skill 卡片
             * 说明：
             * - skills 模式是首页默认模式，因此不写 mode 参数（保持 URL 干净）
             * - sort 继承当前页面（若有），否则默认 heat
             */
            const currentParams = new URLSearchParams(window.location.search);
            const sort = currentParams.get("sort") || "heat";

            const nextParams = new URLSearchParams();
            nextParams.set("ids", relatedSkillIds.join(","));
            if (sort) {
              nextParams.set("sort", sort);
            }

            const url = `/?${nextParams.toString()}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        >
          <Filter aria-hidden="true" />
          筛选相关 Skill
        </button>

        <a
          className="practice-action practice-action--primary"
          href={practice.source_url || "#"}
          target={practice.source_url ? "_blank" : undefined}
          rel={practice.source_url ? "noreferrer noopener" : undefined}
          aria-label="跳转原文"
          aria-disabled={!practice.source_url}
          onClick={(event) => {
            if (!practice.source_url) {
              event.preventDefault();
              return;
            }
            // 同上：避免 focus-within 导致浮层“卡住不消失”。
            (event.currentTarget as HTMLAnchorElement).blur();
            trackClick();
          }}
        >
          <ExternalLink aria-hidden="true" />
          跳转原文
        </a>
      </div>
    </article>
  );
}
