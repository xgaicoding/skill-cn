import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "Skill Hub",
  description: "Skill Hub MVP - Agent Skill 市场",
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
