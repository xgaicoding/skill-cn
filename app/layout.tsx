import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
// 移动端差异覆盖样式必须在 globals.css 之后引入，保证同等选择器下后者能覆盖前者。
import "./mobile.css";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { getSiteUrl } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const siteUrl = getSiteUrl();
const siteOrigin = siteUrl.toString().replace(/\/$/, "");

/**
 * JSON-LD 序列化工具：
 * - 统一在服务端把结构化数据对象转成字符串
 * - 通过替换 `<` 避免被浏览器误解析为 HTML 标签
 */
function toJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * 全站品牌实体（Organization）：
 * - 让搜索引擎明确站点主体与品牌标识
 * - 与 WebSite/SearchAction 形成配套语义
 */
const organizationJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Skill Hub 中国",
  url: siteOrigin,
  logo: `${siteOrigin}/images/logo.svg`,
  sameAs: [],
};

/**
 * 全站站点实体（WebSite + SearchAction）：
 * - 告诉搜索引擎本站支持站内搜索
 * - target 使用首页查询参数 `q`，与当前实现保持一致
 */
const websiteJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Skill Hub 中国",
  url: siteOrigin,
  inLanguage: "zh-CN",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteOrigin}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  title: {
    default: "Skill Hub 中国 - 实战 Skill 案例与可复用方案库",
    template: "%s | Skill Hub 中国",
  },
  description: "Skill Hub 中国：聚合真实 Skill 实战案例与可复用方案，帮助你快速选型、落地并持续提升生产力。",
  keywords: ["Skill Hub", "Skill 中国", "AI 工具实战", "Skill 案例", "工作流自动化", "Claude", "Trae", "Remotion"],
  category: "technology",
  applicationName: "Skill Hub 中国",
  creator: "Skill Hub 中国",
  publisher: "Skill Hub 中国",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  /**
   * 全局 Open Graph / Twitter 默认值：
   * - 作为“兜底”配置，详情页 metadata 会按需覆盖
   * - 预置默认分享图，避免在动态 OG 图上线前出现空白预览
   */
  openGraph: {
    title: "Skill Hub 中国 - 实战 Skill 案例与可复用方案库",
    description: "聚合真实 Skill 实战案例，帮助你更快找到能用、好用、可复用的方案。",
    url: siteOrigin,
    siteName: "Skill Hub 中国",
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/og-cover.png", alt: "Skill Hub 中国" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Hub 中国 - 实战 Skill 案例与可复用方案库",
    description: "聚合真实 Skill 实战案例，帮助你更快找到能用、好用、可复用的方案。",
    images: ["/og-cover.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          {/*
            全站结构化数据：
            - 放在 RootLayout，确保首页与详情页都能被稳定抓取到基础实体信息
            - 详情页特有 JSON-LD（如 SoftwareApplication）在详情页单独注入
          */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(organizationJsonLd) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(websiteJsonLd) }} />
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
          {/*
            Vercel Speed Insights：
            - 采集真实用户性能指标（如 LCP/INP/CLS）
            - 与 Analytics 配合使用，定位体验瓶颈
            - 放在 RootLayout 内确保全站生效
          */}
          <SpeedInsights />
        </div>
      </body>
    </html>
  );
}
