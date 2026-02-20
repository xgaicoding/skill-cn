export function formatCompactNumber(value?: number | null): string {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  if (num < 1000) return String(num);
  const rounded = Math.round((num / 1000) * 10) / 10;
  return `${rounded.toFixed(1)}k`;
}

/**
 * 千分位格式化（完整数字，不缩写）
 * ------------------------------------------------------------
 * 使用场景：
 * - 首页 KPI 需要展示“完整数字 + 千分位逗号”（例如 50,000）
 * - 与 formatCompactNumber 的“缩写展示（1.2k）”形成明确区分
 *
 * 规则：
 * - 非数字、NaN、负数时返回 `fallback`（默认 `—`）
 * - 会先四舍五入到整数，避免浮点口径导致 KPI 视觉抖动
 */
export function formatNumberWithCommas(
  value?: number | null,
  options?: { fallback?: string }
): string {
  const fallback = options?.fallback ?? "—";
  if (value === null || value === undefined) return fallback;

  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 10);
}

export function formatHeat(value?: number | null): string {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  // 热度展示取整：避免小数点，保持卡片信息更简洁
  return String(Math.round(num));
}

export function calcHeat(practiceCount: number, repoStars: number): number {
  return practiceCount * 1000 + repoStars * 0.15;
}
