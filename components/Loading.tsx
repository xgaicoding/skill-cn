import { type CSSProperties, type HTMLAttributes } from "react";

type LoadingProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * 尺寸档位：
   * - xs/sm/md/lg 对应常用尺寸
   * - 可配合 sizePx 精准控制
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * 指定像素尺寸（优先级高于 size）
   * - 适用于按钮内小号 loading
   */
  sizePx?: number;
  /**
   * 展示形态：
   * - ring：环形加载
   * - dots：三点加载（更适合按钮内/行内）
   */
  variant?: "ring" | "dots";
  /**
   * 是否全屏遮罩（默认关闭）
   */
  fullScreen?: boolean;
  /**
   * 无障碍文案，供屏幕阅读器读取
   */
  label?: string;
};

export const Loading = ({
  size = "md",
  sizePx,
  variant = "ring",
  fullScreen = false,
  label = "加载中",
  className = "",
  style,
  role,
  "aria-label": ariaLabel,
  "aria-live": ariaLive,
  ...props
}: LoadingProps) => {
  const sizeMap: Record<NonNullable<LoadingProps["size"]>, number> = {
    xs: 16,
    sm: 24,
    md: 48,
    lg: 72,
  };

  // 以 sizePx 为优先级，确保业务侧无需手动覆盖 style.width/height
  const px = Math.max(12, Math.round(sizePx ?? sizeMap[size]));
  // 环形厚度随尺寸等比缩放，避免小号过粗 / 大号过细
  const ring = Math.max(2, Math.round(px / 12));
  // dots 形态的视觉占宽略大，否则显得拥挤
  const widthPx = variant === "dots" ? Math.round(px * 1.6) : px;

  /**
   * style 合并策略：
   * - 保证 position: relative 始终存在，避免伪元素定位失效
   * - 通过 CSS 变量透出关键尺寸，便于在 style 标签里使用
   */
  const mergedStyle: CSSProperties = {
    ...(style || {}),
    width: widthPx,
    height: px,
    position: "relative",
    ["--sh-loading-size" as any]: `${px}px`,
    ["--sh-loading-ring" as any]: `${ring}px`,
  };

  const content =
    variant === "dots" ? (
      <div
        className={`sh-loading sh-loading--dots ${className}`.trim()}
        style={mergedStyle}
        role={role ?? "status"}
        aria-label={ariaLabel ?? label}
        aria-live={ariaLive ?? "polite"}
        {...props}
      >
        <span className="sh-loading__dot" aria-hidden="true" />
        <span className="sh-loading__dot" aria-hidden="true" />
        <span className="sh-loading__dot" aria-hidden="true" />
        {/* Loading 的样式由全局 CSS 提供（app/globals.css），避免 SSR/CSR 文本不一致。 */}
      </div>
    ) : (
      <div
        className={`sh-loading sh-loading--ring ${className}`.trim()}
        style={mergedStyle}
        role={role ?? "status"}
        aria-label={ariaLabel ?? label}
        aria-live={ariaLive ?? "polite"}
        {...props}
      >
        {/* Loading 的样式由全局 CSS 提供（app/globals.css），避免 SSR/CSR 文本不一致。 */}
      </div>
    );

  if (fullScreen) {
    return (
      <div
        className="sh-loading-mask"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.45)",
          backdropFilter: "blur(10px) saturate(160%)",
          zIndex: 999,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};
