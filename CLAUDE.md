# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 底线要求
- **总是用中文回答**
- **代码要有详细的注释**

## 常用命令
```bash
npm run dev        # 启动开发服务器 (http://localhost:3000)
npm run build      # 生产构建
npm run start      # 启动生产服务
npm run lint       # ESLint 检查
```

数据导入（需要 .env 中的 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY）：
```bash
node manage/import_skills.js              # 导入 manage/skills.json
node manage/import_practices.js           # 导入 manage/practices.json
node manage/import_skills.js --dry-run    # 仅校验不写入
```

## 架构概览

### 双模式首页
首页有两种浏览模式，通过 URL 参数 `mode=practices` 切换：
- **Skill 模式**（默认）：展示 Skill 卡片网格，支持 tag/sort/q/ids 筛选
- **实践模式**：展示实践文章卡片流，hover 浮层操作（PC）或 Bottom Sheet（移动端）

所有筛选状态（tag/sort/mode/ids/q）全部同步到 URL，支持分享/刷新/回退。

### PC/Mobile 双套 UI
通过 Server Component 读取 UA（`lib/device.ts`）做设备判断，在首屏直接选择对应 View，避免 Hydration 闪烁。**不是**用 CSS 媒体查询隐藏/显示，而是在组件层面条件渲染：
- PC：`HomePage` 直接渲染桌面版（FeaturedCarousel + ModeDock + 分页）
- Mobile：`HomePage` 渲染 `HomeMobileView`（Hero 轮播 + sticky Toolbar + 两列网格 + 无限滚动 + ActionSheet）
- `DetailPage` 内部同样有 PC/Mobile 两套完整渲染分支

### 详情页双阶段加载
`/api/skills/[id]?refresh=0` 先返回数据库缓存（快），客户端再异步请求 `?refresh=1` 触发 GitHub 同步（慢但数据新）。用户先看到页面再在后台更新。

### 数据库三表 + 触发器
- `skills`、`practices`、`practice_skills`（多对多关联表）
- 数据库触发器自动将 `practices.skill_ids` 同步到 `practice_skills`
- 触发器在关联变更或 `is_listed` 变更时自动刷新 `skills.practice_count`
- 计数使用 RPC 原子操作：`increment_skill_download`、`increment_practice_click`

### 热度算法
```
heat_score = practice_count × 1000 + repo_stars × 0.15
```
在 `lib/format.ts` 的 `calcHeat()` 中定义，GitHub 同步时计算并写入 `skills.heat_score`。

### 精选实践强制禁缓存
`/api/practices/featured` 使用多层策略确保返回实时数据：route segment config (`dynamic`, `revalidate`, `fetchCache`) + `noStore()` + 自定义 fetch no-store client + HTTP response headers。

### 无限滚动双保险
移动端和 PC 端的实践列表使用 IntersectionObserver 做触底加载，同时增加 scroll 事件监听作为 fallback，解决部分 iOS WebView 中 Observer 不触发的问题。用 `loadMoreLockedRef` 防重复触发。

## CSS 规范
- **`app/globals.css`**：通用 + 桌面默认样式（~2000 行）
- **`app/mobile.css`**：纯移动端差异覆盖（`@media max-width: 767px`，~1465 行）
- mobile.css 必须在 globals.css 之后引入（`app/layout.tsx` 中保证）
- CSS 动画必须做 GPU 加速优化：使用 `transform: translate3d(0,0,0)`、`will-change`、`backface-visibility: hidden`
- 移动端禁用 `backdrop-filter`（iOS/微信滚动时会导致持续重绘、卡顿、发热），改用高不透明度纯色背景

## 编码约定
- 数据源统一：同一变量不在不同位置同时声明
- Supabase 客户端分两种：`getSupabaseServerClient`（常规服务端）和 `getSupabaseServerClientNoStore`（绕过 Next Data Cache）
- 详情页 body 通过 `BodyClass` 组件注入 `is-detail` class，移动端 CSS 据此做差异化
- `practice.summary` 后端可能包含 `\n` 字面量，前端统一做 `.replace(/\\n/g, "\n").replace(/\r?\n/g, " ")`
- GitHub Issue 链接使用 `lib/constants.ts` 中的固定常量，不依赖环境变量
