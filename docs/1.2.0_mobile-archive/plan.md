<!--
  v1.2.0 Mobile Web 技术方案
  说明：
  - 本文档面向“落地实现”，偏工程视角（组件拆分、复用边界、风险与验收）。
  - 移动端必须沿用现有 PC 视觉风格；PC 端 Hero 区保持现有逻辑不修改（仅允许修复性调整）。
-->

# v1.2.0（Mobile Web）技术方案 / 实施计划

## 0. 目标与约束
### 0.1 目标
- 同一套 URL / 同一套数据接口下，实现 PC + H5 的体验“各自最优”（移动端不依赖 hover、支持无限滚动、交互更贴合触控）。
- **复用尽可能多的业务逻辑**（筛选/排序/URL 同步/数据请求/错误处理），把“端差异”收敛到 View 层。
- 产物可灰度、可回滚，且不引入显著性能回退。

### 0.2 强约束（来自 PRD/验收口径）
- PC 端 Hero 区逻辑 **不修改**（移动端 Hero 采用独立实现）。
- URL Query 表达状态：`mode/tag/sort/q/ids`，支持刷新/分享/前进后退。
- 移动端列表：两列网格 + **无限滚动**（不使用分页按钮）。
- 移动端实践模式：卡片点击弹 ActionSheet（替代 hover），卡片本体不直接跳转。
- 动效：优先 `transform/opacity`，并尊重 `prefers-reduced-motion`。

---

## 1. 总体架构：Container / View 分层（PC/H5 视图隔离，逻辑复用）
### 1.1 分层原则
- **Container（容器层）**：负责“状态机与数据”（筛选、URL 同步、请求、聚合、错误态、加载态、埋点/点击统计等）。
- **View（视图层）**：只负责“怎么展示 + 端特有交互”（PC：分页/hover；H5：无限滚动/ActionSheet/底部模式条等）。

这样做的核心收益：
- 业务逻辑只写一份（降低 bug 与双端不一致概率）。
- PC/H5 UI 互不污染（避免堆满 `if (isMobile)` 导致不可维护）。

### 1.2 端判断策略（避免移动端首屏闪 Desktop）
问题：纯 `useEffect + matchMedia` 会导致 SSR/首屏先渲染错误端，移动端会短暂看到 Desktop 布局。

方案：**服务端 UA 粗判 + 客户端 resize 兜底**  
- 在 Server Component（`app/page.tsx`、`app/skill/[id]/page.tsx`）读取 `user-agent`，计算 `deviceKind`（`mobile | tablet | desktop`），作为 prop 传入 Client Component。
- Client Component 首次渲染用该 prop 决定 View（避免首屏闪）。
- 可选：在客户端监听 `resize`，当用户旋转屏幕或拉伸窗口时动态切换（仅在开发/桌面浏览器模拟时有意义，真实手机影响极小）。

示例（伪代码，仅表达意图）：
```ts
// lib/device.ts
// 注意：这里只做“展示层”的粗粒度判断，不用于安全/鉴权等逻辑。
export type DeviceKind = "mobile" | "tablet" | "desktop";

export function detectDeviceKindFromUA(ua: string): DeviceKind {
  // 规则尽量保守：宁可把部分大屏手机识别为 tablet，也不要把手机识别为 desktop。
  const lower = (ua || "").toLowerCase();
  if (/(iphone|ipod|android.*mobile|windows phone)/i.test(lower)) return "mobile";
  if (/(ipad|android(?!.*mobile))/i.test(lower)) return "tablet";
  return "desktop";
}
```

---

## 2. 代码组织（建议目录与复用边界）
> 不强制一次性大迁移；按模块渐进拆分，保证每一步都可运行。

### 2.1 建议新增/调整的目录
- `lib/device.ts`：UA 端类型判断工具（仅展示用途）。
- `components/home/HomePageContainer.tsx`：首页容器层（从当前 `components/home/HomePage.tsx` 抽离/演进）。
- `components/home/desktop/*`：PC 首页视图组件（复用现有 Toolbar/Grid/Pagination/ModeDock）。
- `components/home/mobile/*`：H5 首页视图组件（Hero 轮播/筛选条/两列网格/无限滚动/ActionSheet/底部模式条）。
- `components/detail/DetailPageContainer.tsx`：详情页容器层（从当前 `components/detail/DetailPage.tsx` 抽离/演进）。
- `components/detail/desktop/*`、`components/detail/mobile/*`：详情页 PC/H5 视图组件。
- `components/ui/*`（可选）：ActionSheet/Toast/Chip/Button 等通用原子组件沉淀。

### 2.2 复用 vs 隔离清单（工程口径）
复用（同一套实现）：
- `app/api/*`：全部接口（skills/practices/featured/click 等），PC/H5 统一。
- URL 状态协议与同步规则：`mode/tag/sort/q/ids`（包含“2A + Chip”的 ids 清理规则）。
- 数据请求、错误处理、空态/骨架的“状态机”逻辑（放 Container 层）。
- 设计 token（颜色/阴影/圆角/间距变量）：统一在 `app/globals.css` 基础上，移动端用媒体查询覆盖变量。

隔离（按端分别实现）：
- Header：移动端去掉登录/提交入口；详情页不展示搜索。
- Hero：PC 保持现状；H5 用横向轮播（品牌卡 + 推荐实践卡）。
- Mode 切换：PC 右侧 Dock（可拖拽）；H5 底部 Segmented（随滚动显隐）。
- 列表加载：PC 分页；H5 无限滚动。
- 实践卡片交互：PC hover 蒙层；H5 ActionSheet。

---

## 3. 首页（Home）技术方案
### 3.1 首页容器层（HomePageContainer）
职责（复用双端）：
- 维护筛选状态：`mode/tag/sort/q/ids/page`
- 统一 URL 同步：`router.push/replace` 拼装 query（复用现有 `pushSearchParams` 思路）
- 拉取数据：
  - `featured practices`（Hero 推荐）
  - `skills list`（skills mode）
  - `practices list`（practices mode）
- 统一错误态/空态/骨架逻辑
- 对外暴露 View 所需的“渲染数据模型”（例如：skills 数组、practices 数组、loading/error、分页信息等）

实现建议：
- 现有 `components/home/HomePage.tsx` 逻辑较完整，可先“轻重拆分”：
  1) 抽出 `HomeDesktopView`，让现有 JSX 挪进去（保持行为不变）
  2) HomePage 作为容器，新增 `HomeMobileView`
  3) 再逐步把 URL 同步、请求逻辑收敛成 hook（例如 `useHomeState`）

### 3.2 首页端视图选择（PC/H5）
- `deviceKind === "mobile"`：渲染 `HomeMobileView`
- 其他：渲染 `HomeDesktopView`（tablet 可先按 desktop 处理，避免在本期扩大范围）

### 3.3 H5 首页视图（HomeMobileView）
包含模块（与 mockup 对齐）：
- `HeroMobileCarousel`：
  - 第 1 张：品牌卡（Skill Hub 中国 + slogan）
  - 第 2 张起：推荐实践卡（去掉 skill 标签、去掉底部阴影等细节已在视觉确认）
- `MobileToolbarSticky`：
  - Tag：横向滚动 chips（单行不换行）
  - Sort：最热/最新（图标与 PC 保持一致）
  - ids 锁定集合 Chip：存在时显示，可清除；点击任意 Tag 触发 2A（清 ids）
- `SkillGrid2Col` / `PracticeGrid2Col`：
  - 两列网格，卡片定高，标题/摘要截断规则见 PRD
  - skeleton/空态/错误态适配两列布局
- `InfiniteLoader`：
  - 用 IntersectionObserver 监听“列表底部哨兵”触发加载下一页
  - 触发条件：未加载中 && 未到末页
  - 失败：展示“重试”按钮（不打断用户滚动）
- `ModeBarMobile`：
  - 底部悬浮 segmented：skills / practices
  - 显隐：下滑隐藏，上滑/停住出现（滚动节流/去抖，避免抖动）
  - 切换模式：scrollTo(0) + URL 同步

### 3.4 H5 实践卡片交互（ActionSheet）
关键规则：
- 卡片点击：**只打开 ActionSheet**（不直接跳转原文）
- ActionSheet：
  - 信息：标题、渠道·作者、摘要、日期、阅读量、关联 skills（横向滚动）
  - 动作：左右两个按钮
    - “打开原文”：打开 `source_url` + 记录 click（与现有统计一致，不阻塞）
    - “筛选相关 Skill”：在**同页**切回 skills 模式，并写入 `ids=...`（复用 2A + Chip 语义）
  - 关闭：点击遮罩关闭；点击任一动作后关闭；无“取消”按钮

---

## 4. Header / Footer 技术方案
### 4.1 Header（AppHeader）改造策略
需求点：
- 移动端 Header 只要：Logo / 搜索 / 交流群 / 官方文档
- 不要：提交 Skill / 登录
- Skill 详情页：不需要搜索

实现建议（最小侵入）：
- `AppHeader` 保持单组件，但拆出清晰的结构块：
  - `HeaderTopRow`：logo + 右侧入口（文字链按钮，橙色）
  - `HeaderSearchRow`：仅在“首页”显示；详情页隐藏
- 详情页识别方式：
  - 在 `AppHeader` 内使用 `usePathname()` 判断 `pathname.startsWith("/skill/")`，隐藏搜索行（仅影响渲染，不影响 URL 协议）
- 移动端隐藏 AuthActions：
  - 方案 A（推荐）：CSS 媒体查询隐藏（保证不引入额外 props 传递）
  - 方案 B：配合 `deviceKind` prop，移动端不渲染（减少无用节点与事件）
  - 本期优先 A，后续如需更极致性能再升级 B

### 4.2 Footer（AppFooter）改造策略
- 移动端展示极简文案 + 版权
- PC 端保持现有 footer

建议做法：
- `AppFooter` 内渲染两套 block（desktop / mobile），用媒体查询控制显示
- 注意移动端 block 文字行高与边距，避免占屏过大

---

## 5. Skill 详情页技术方案
### 5.1 详情页容器层（DetailPageContainer）
复用逻辑：
- skill 数据拉取（refresh=0 快路径 + refresh=1 后台更新）
- practices 列表拉取（已有 sort=heat/recent 与分页参数）
- 点击统计、格式化工具等

### 5.2 H5 详情页视图（DetailMobileView）
差异点（PRD）：
- 不展示 Header 搜索（由 AppHeader 处理）
- “投稿/下载”等 PC 专属能力：点击 toast “请前往PC版网页使用功能”
- 不展示“打开 GitHub”
- 展示 Skill 关联实践卡片：
  - 两列布局
  - 无限滚动加载
  - skeleton/失败重试/到底提示齐全
  - 与首页实践卡片样式对齐（信息密度与圆角一致）

实现建议：
- 复用现有 practices 请求逻辑，但把渲染改为可插拔 View：
  - PC：沿用现有单列 practice-card（保持现状，减少风险）
  - H5：两列卡片 + 无限滚动

---

## 6. CSS / 组件样式策略（不重做视觉，做移动端密度与布局）
### 6.1 统一 token + 移动端覆盖
- 保持现有 `app/globals.css` 视觉基调
- 样式文件拆分（最小改动方案，推荐）：
  - 保留 `app/globals.css`：负责 **通用样式 + 桌面默认样式**
    - 包含：设计 token / reset / 通用组件（btn/chip/skeleton/empty/toast 等）/桌面默认布局与组件样式
    - 兼容性与可访问性规则（如 `prefers-reduced-motion`、`(hover: hover)`）属于“全端能力兜底”，建议继续留在 `globals.css`
  - 新增 `app/mobile.css`：只放 **移动端覆盖（Mobile overrides）**
    - 原则：移动端差异尽量收敛在该文件，避免散落到全局导致维护成本上升
    - 主要以 `@media (max-width: 767px)` 进行覆盖（必要时可加 420/360 等更小断点）
  - 在 `app/layout.tsx` 按顺序引入，确保移动端样式最后覆盖：
    - `import "./globals.css";`
    - `import "./mobile.css";`

- 移动端覆盖内容（放入 `app/mobile.css`，以 `@media (max-width: 767px)` 为主）：
  - 页面内边距、卡片圆角（移动端收敛）、阴影强度（移动端更克制）
  - Grid：skills/practices 两列
  - Header 两行布局、入口按钮样式（文字链）
  - 底部 ModeBar 的 safe-area 处理（`padding-bottom: env(safe-area-inset-bottom)`）

- 迁移规则（便于执行与验收）：
  - `globals.css` 中出现的移动端覆盖（例如 `@media (max-width: ...)`）应迁移到 `mobile.css` 后从 `globals.css` 删除，避免“双处生效”与维护漂移
  - 非媒体查询的“通用兜底”样式（例如 `prefers-reduced-motion`）不要迁移到 `mobile.css`，保持全端一致

### 6.2 动效与性能
- ActionSheet：只使用 `transform: translate3d(...)` + `opacity` 过渡
- 避免移动端大面积 `backdrop-filter: blur(...)`；如必须用，提供纯色/半透明降级
- 所有动效在 `@media (prefers-reduced-motion: reduce)` 下禁用或改为瞬时切换

---

## 7. 测试与验收（工程自测清单）
### 7.1 覆盖设备/断点
- 320 / 360 / 390 / 414 宽度（手机常见）
- 768 宽度（平板/折叠屏保底不溢出）

### 7.2 关键路径用例（必须过）
首页（H5）：
- skills/practices 模式切换（底部模式条）：切换后回到顶部，URL 正确
- Tag 筛选、Sort 切换：列表正确刷新；加载/骨架/错误态正确
- 无限滚动：能加载到下一页；到底提示正确；失败可重试
- practices mode：点卡片弹 ActionSheet；点“打开原文”能打开且统计不阻塞；点“筛选相关 Skill”切回 skills 并写 ids
- ids 锁定集合：Chip 可见；点 Chip 清除；点任意 Tag 触发 2A 清 ids

详情页（H5）：
- 页面可读、无横向溢出
- PC 专属按钮点了有 toast 提示
- 关联实践两列 + 无限滚动正常；空态/失败态正常

工程质量：
- `npm run build` 无 TS 报错
- 关键页面无明显 CLS（布局抖动）与交互卡顿

---

## 8. 实施步骤（建议按提交拆分）
1) **基础端判定与骨架拆分**
   - 新增 `lib/device.ts`
   - `app/page.tsx`、`app/skill/[id]/page.tsx` 透传 `deviceKind`
2) **Header/Footer 移动端布局**
   - AppHeader：两行布局 + 移动端隐藏 AuthActions + 详情页隐藏搜索
   - AppFooter：移动端极简 block
3) **Home 容器/视图拆分**
   - 抽 `HomeDesktopView` 保持现状可运行
   - 新增 `HomeMobileView` 基础布局（不含无限滚动/ActionSheet 也可先跑通）
4) **H5 列表两列 + skeleton 适配**
   - skills/practices 卡片定高、圆角收敛、两列网格
   - skeleton/空态/错误态适配
5) **H5 无限滚动 + ActionSheet**
   - InfiniteLoader hook
   - practices 卡片 ActionSheet（信息 + 按钮）
6) **H5 详情页适配**
   - 两列关联实践 + 无限滚动
   - PC 专属功能 toast 提示 + 隐藏打开 GitHub
7) **全链路回归 + 性能检查**
   - 关键路径用例全过
   - `npm run build` 通过

---

## 9. 风险与回滚策略
### 9.1 风险点
- UA 识别不准确（部分设备误判）：通过 CSS 断点兜底布局不溢出；行为差异尽量在客户端可自纠。
- 无限滚动重复请求/数据重复：合并列表时需去重（按 id），并严控 loading 状态切换。
- Swiper/轮播在移动端性能：限制卡片数量、禁用重阴影、尊重 reduced-motion。

### 9.2 回滚策略
- 保持 PC 视图路径不变：移动端 View 以增量方式接入；出现问题可临时降级为“移动端走桌面分页列表”（仅应急，不作为长期方案）。
- 所有移动端新组件尽量“可拔插”，不改动 API 协议与数据库结构。
