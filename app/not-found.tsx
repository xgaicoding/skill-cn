import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "页面未找到",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-page__content">
        <p className="not-found-page__eyebrow">404</p>
        <h1 id="not-found-title">页面未找到</h1>
        <p>这个链接暂时不可用，可以返回首页继续查找 Skill 和实践案例。</p>
        <Link className="not-found-page__link" href="/">
          返回首页
        </Link>
      </div>
    </main>
  );
}
