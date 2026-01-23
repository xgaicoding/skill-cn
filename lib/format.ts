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
