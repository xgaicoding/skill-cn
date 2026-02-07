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

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
