import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "Skill Hub 中国",
  description: "助力国内 Skill 使用者快速找到能用、好用、可复用的实践方案",
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <AppHeader />
          {children}
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
