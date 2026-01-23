/**
 * 自定义 Document（仅用于 Next.js 的 pages router）
 * -------------------------------------------------
 * 背景：
 * - 项目主要使用 app router（`app/` 目录），正常情况下无需 `_document`。
 * - 但在当前构建环境（Node 版本较新）下，`next build` 的某些阶段会尝试加载 `/_document`，
 *   若 pages-manifest 未包含该入口则会触发构建失败。
 *
 * 目标：
 * - 提供一个最小、稳定的 `_document`，让构建流程可正常继续。
 * - 不引入任何额外逻辑；页面视觉仍以 `app/layout.tsx` + `app/globals.css` 为准。
 *
 * 备注：
 * - `_document` 只影响 pages router 渲染的页面；app router 页面仍由 `app/layout.tsx` 控制。
 */
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        {/* 
          这里保持“最小化”：不注入额外脚本/样式，避免影响 app router 的布局与性能。
          如后续需要全站级别的 meta/link，优先放在 `app/layout.tsx`。 
        */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

