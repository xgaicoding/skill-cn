import { type HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * 宽度：支持数字（像素）或字符串（百分比/px/rem 等）。
   */
  width?: string | number;
  /**
   * 高度：支持数字（像素）或字符串（百分比/px/rem 等）。
   */
  height?: string | number;
  /**
   * 形状：
   * - rect：默认圆角矩形
   * - circle：圆形
   * - text：更接近文本行的轻量圆角
   */
  variant?: "rect" | "circle" | "text";
};

export const Skeleton = ({
  width,
  height,
  variant = "rect",
  style,
  className = "",
  ...props
}: SkeletonProps) => {
  /**
   * 根据 variant 输出圆角值，保证不同形状视觉一致。
   */
  const getBorderRadius = () => {
    switch (variant) {
      case "circle":
        return "50%";
      case "text":
        return "4px";
      default:
        return "var(--radius-sm)";
    }
  };

  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        borderRadius: getBorderRadius(),
        ...style,
      }}
      {...props}
    >
      {/* Skeleton 的基础样式由全局 CSS 提供（app/globals.css），这里仅输出结构。 */}
    </div>
  );
};
