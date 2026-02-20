import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * robots.txt：
 * - 允许抓取站点页面
 * - 禁止抓取 API 与认证回调路径
 * - 显式声明 sitemap 入口，方便搜索引擎发现
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const siteOrigin = siteUrl.toString().replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"],
    },
    // 显式声明 host，帮助爬虫统一识别首选域名（www）。
    host: siteOrigin,
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
