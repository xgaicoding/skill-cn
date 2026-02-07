/**
 * 统一解析站点根 URL（用于 metadataBase / canonical / sitemap / og:url）。
 *
 * 约定：
 * - 直接固定生产域名，避免依赖环境变量配置
 * - 这里返回 URL 对象，便于拼接 pathname，避免手工拼接带来的斜杠问题
 * - 仅在 Server Component / Route Handler 中使用，避免把常量泄漏到 Client
 */
const SITE_URL = "https://www.skill-cn.com";

export function getSiteUrl() {
  return new URL(SITE_URL);
}
