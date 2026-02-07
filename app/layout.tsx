import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
// 移动端差异覆盖样式必须在 globals.css 之后引入，保证同等选择器下后者能覆盖前者。
import "./mobile.css";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { getSiteUrl } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Skill Hub 中国",
  description: "助力国内 Skill 使用者快速找到能用、好用、可复用的实践方案",
  /**
   * metadataBase 用于拼接 canonical / OG / Twitter 等绝对 URL：
   * - 统一从环境变量读取，确保生产环境 URL 正确
   * - 本地开发缺省时自动回退到 localhost，避免报错
   */
  metadataBase: siteUrl,
  /*
   * 统一配置站点图标：兼顾现代浏览器的 SVG、传统浏览器的 ICO，
   * 以及移动端的触控图标，避免仅依赖默认 favicon 导致的模糊或缺失。
   */
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  /*
   * PWA 清单与主题色用于浏览器 UI 与系统安装体验，
   * 保持与站点品牌色一致。
   */
  manifest: "/site.webmanifest",
  themeColor: "#FF6B00",
  /**
   * 全局 Open Graph / Twitter 默认值：
   * - 作为“兜底”配置，详情页 metadata 会按需覆盖
   * - 预置默认分享图，避免在动态 OG 图上线前出现空白预览
   */
  openGraph: {
    siteName: "Skill Hub 中国",
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og-cover.png", alt: "Skill Hub 中国" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          {/*
            Next.js 要求：
            - 在静态预渲染阶段（next build / export），使用 useSearchParams 的客户端组件需要被 Suspense 包裹
            - 否则会出现：useSearchParams() should be wrapped in a suspense boundary 的构建报错
            说明：
            - Header 内部会根据 URL（mode/q）切换搜索占位与隐藏字段，因此使用了 useSearchParams
            - 这里用一个“无侵入”的 Suspense 边界兜底；fallback 为空即可（Header 仍会很快渲染出来）
          */}
          <Suspense fallback={null}>
            <AppHeader />
          </Suspense>
          {children}
          <AppFooter />
          {/*
            Vercel Web Analytics：
            - 采集页面访问与基础性能指标
            - 放在 RootLayout 内确保全站生效
            - 组件本身不会改变布局或影响首屏内容渲染
          */}
          <Analytics />
        </div>
      </body>
    </html>
  );
}
