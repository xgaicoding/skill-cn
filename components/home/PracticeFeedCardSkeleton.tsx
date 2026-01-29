import { Skeleton } from "@/components/Skeleton";

/**
 * PracticeFeedCardSkeleton（首页实践模式骨架卡片）
 * ------------------------------------------------------------
 * 目标：
 * - 结构尽量贴近真实 PracticeFeedCard，避免加载完成后出现明显的高度/布局抖动
 * - 不做复杂动画，依赖全局 skeleton 的轻量 shimmer（若有）即可
 */
export default function PracticeFeedCardSkeleton() {
  return (
    <article className="practice-card practice-card--feed" aria-hidden="true">
      <div className="practice-card__content">
        {/* 顶部：来源 + 日期 */}
        <div className="practice-card__top">
          <Skeleton width={110} height={16} variant="text" />
          <Skeleton width={120} height={16} variant="text" />
        </div>

        {/* 标题：模拟 1~2 行 */}
        <Skeleton width="86%" height={22} variant="text" />
        <Skeleton width="62%" height={22} variant="text" />

        {/* 摘要：固定 5 行节奏（高度由 CSS 控制，这里用 4~5 行 skeleton 贴近观感） */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "1 1 auto" }}>
          <Skeleton width="100%" height={14} variant="text" />
          <Skeleton width="94%" height={14} variant="text" />
          <Skeleton width="98%" height={14} variant="text" />
          <Skeleton width="88%" height={14} variant="text" />
          <Skeleton width="72%" height={14} variant="text" />
        </div>

        {/* 底部：skills + 阅读量 */}
        <div className="practice-card__bottom">
          <Skeleton width={160} height={14} variant="text" />
          <Skeleton width={70} height={14} variant="text" />
        </div>
      </div>
    </article>
  );
}

