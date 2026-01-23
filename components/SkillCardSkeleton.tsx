import { Skeleton } from "@/components/Skeleton";

export const SkillCardSkeleton = ({ showPublisher = true }: { showPublisher?: boolean }) => {
  return (
    <div
      className="skill-card"
      style={{
        height: "100%",
        minHeight: "200px",
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        borderColor: "transparent",
      }}
      aria-busy="true"
    >
      {/* 顶部区域：标签 + 热度/Stars 的占位 */}
      <div className="skill-card__header">
        <Skeleton width={60} height={24} style={{ borderRadius: 999 }} aria-hidden="true" />
        <div className="skill-card__header-right" aria-hidden="true">
          <Skeleton width={72} height={16} variant="text" />
          <Skeleton width={64} height={16} variant="text" />
        </div>
      </div>

      {/* 标题占位：更粗更短，模拟真实标题长度 */}
      <Skeleton width="70%" height={28} variant="text" style={{ marginTop: 8, marginBottom: 4 }} aria-hidden="true" />

      {/* 简介占位：两行文本，避免卡片高度抖动 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }} aria-hidden="true">
        <Skeleton width="100%" height={16} variant="text" />
        <Skeleton width="90%" height={16} variant="text" />
      </div>

      {/* 底部元信息：对齐真实卡片的 meta 区域 */}
      {showPublisher ? (
        <div className="skill-card__meta" style={{ marginTop: "auto" }} aria-hidden="true">
          <Skeleton width={120} height={16} variant="text" />
          <Skeleton width={90} height={16} variant="text" />
          <Skeleton width={70} height={16} variant="text" />
        </div>
      ) : null}
    </div>
  );
};
