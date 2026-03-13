# 1.6.1 Google Analytics 接入

## 背景

需要接入 Google Analytics（GA4）来追踪网站数据，包括用户访问、页面浏览、事件等。

## 目标

1. 接入 GA4，获取基础流量数据（PV、UV、来源、地域等）
2. 配置关键事件追踪（案例点击、Skill 查看、外链跳转等）
3. 与 Google Search Console 联动，打通 SEO 数据

## 技术方案

### 1. 基础接入

- 使用 `@next/third-parties` 的 `GoogleAnalytics` 组件（Next.js 官方推荐）
- 在 `app/layout.tsx` 中引入，传入 GA Measurement ID
- 环境变量：`NEXT_PUBLIC_GA_ID`

### 2. 自定义事件追踪

需要追踪的关键事件：
- `practice_click` — 实践案例点击（带 practice_id, skill_name）
- `skill_view` — Skill 详情页查看（带 skill_id, skill_name）
- `outbound_link` — 外链跳转（带 url, context）
- `search` — 站内搜索（带 search_term）
- `mode_switch` — 首页模式切换（Skill/实践）

### 3. 环境配置

- 生产环境：启用上报
- 开发环境：不上报（通过环境变量控制）

## 前置条件

- [ ] 骁哥在 Google Analytics 后台创建 GA4 属性，获取 Measurement ID（格式：G-XXXXXXXXXX）
- [ ] 将 Measurement ID 配置到 Vercel 环境变量

## 实施步骤

1. 安装依赖 + 基础接入
2. 配置自定义事件
3. 验证数据上报
4. 关联 Search Console

## 状态

🟡 等待 GA4 Measurement ID
