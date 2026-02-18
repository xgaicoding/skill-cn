export function formatCompactNumber(value?: number | null): string {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  if (num < 1000) return String(num);
  const rounded = Math.round((num / 1000) * 10) / 10;
  return `${rounded.toFixed(1)}k`;
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

/**
 * 判断时间是否在“最近 N 天”窗口内（用于 NEW 角标）。
 *
 * 口径说明：
 * - 比较方式是“当前时间 - updated_at”的毫秒差值
 * - 只要差值 <= N 天（含边界）就返回 true
 * - 若后端时间略微超前（出现未来时间），也视为“新内容”返回 true
 */
export function isWithinDays(value: string | null | undefined, days: number): boolean {
  if (!value) return false;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return false;

  const now = Date.now();
  if (target >= now) {
    return true;
  }

  const windowMs = days * 24 * 60 * 60 * 1000;
  return now - target <= windowMs;
}
