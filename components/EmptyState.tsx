import type { ReactNode } from "react";

/**
 * EmptyState（通用空状态组件）
 * ------------------------------------------------------------
 * 设计目标：
 * - 参考 skillhub 的 EmptyState 结构：图标 → 标题 → 描述 → 行动按钮
 * - 保持“无框 / 轻量玻璃态”的视觉，避免出现大面积纯白底带来的突兀感
 * - 可复用在首页列表空态、详情页实践空态、OAuth 回调页提示等位置
 */
export type EmptyStateProps = {
  /** 空状态主标题：一句话说明当前状态（例如：暂无 Skill / 暂无结果 / 加载失败） */
  title: string;
  /** 进一步说明：给用户下一步指引（例如：尝试清空搜索或切换标签） */
  description?: string;
  /** 视觉主图标：用于快速建立“空态语义”（可传 lucide icon / 自定义 SVG） */
  icon?: ReactNode;
  /** 行动区域：通常放一个按钮（清空筛选/提交 Skill/重试等） */
  action?: ReactNode;
  /** 额外 className：便于在不同页面做小范围差异化 */
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={["empty-state", className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      {/* 图标：放在最上方，用户第一眼先“看懂”当前状态 */}
      {icon ? (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}

      {/* 标题：用更强调的字体与字号，但不做“刺眼高亮” */}
      <h3 className="empty-state__title">{title}</h3>

      {/* 描述：作为引导文案，强调“下一步怎么做” */}
      {description ? <p className="empty-state__desc">{description}</p> : null}

      {/* 行动：按钮/链接可选；当业务不需要动作时可以不传 */}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

