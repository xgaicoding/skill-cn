import { Skeleton } from "@/components/Skeleton";

/**
 * MarkdownSkeleton：
 * - 用于正文 Markdown 尚未渲染完成的阶段
 * - 通过“标题 + 段落 + 代码块”组合，模拟真实阅读节奏
 */
export const MarkdownSkeleton = ({ lines = 10 }: { lines?: number }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true">
      {/* 标题占位：更粗更短，让用户知道阅读从哪里开始 */}
      <Skeleton width="38%" height={22} variant="text" aria-hidden="true" />

      {/* 正文段落：不同宽度制造自然的换行节奏 */}
      {Array.from({ length: Math.max(4, lines) }).map((_, index) => {
        const width = index % 4 === 3 ? "72%" : index % 7 === 0 ? "92%" : "100%";
        return <Skeleton key={index} width={width} height={14} variant="text" aria-hidden="true" />;
      })}

      {/* 代码块占位：在 Skill 文档中很常见，因此提供明显的块状结构 */}
      <Skeleton width="100%" height={120} style={{ borderRadius: 14 }} aria-hidden="true" />
    </div>
  );
};
