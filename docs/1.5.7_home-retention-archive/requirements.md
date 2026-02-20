# v1.5.7 首页回访动机增强（首屏“更新看板”Banner）PRD

> 版本：1.5.7 | 日期：2026-02-19 | 状态：范围对齐（以最新视觉稿为准）

## 变更记录

- 2026-02-19：确定本期方向为“首屏更新看板”——左侧 **品牌区 + 4 项关键数据（KPI）**，右侧为 **每周精选 / 热门榜单合并模块（Tab + 轮播，每页 3 条）**；Banner **严格一屏**。
- 2026-02-19：根据最新视觉稿确认与裁剪：
  - **不做**「每周新上模块」与 `NEW` 角标
  - **热门榜单不展示排名**（与每周精选条目样式完全对齐）
  - KPI 数字 **只展示完整数值 + 千分位逗号**（例如 `50,000`），**不使用** `K+ / 万+ / +` 等缩写或模糊表达
  - 全站 hover 反馈 **不做上浮/阴影变化**，仅保留“边框高亮/下划线高亮”
- 2026-02-19：范围再收敛：**本次只改 PC 首页首屏**，移动端首页结构与样式保持现状，不在 v1.5.7 交付范围内。
- 2026-02-19：补充 KPI 导航逻辑（首屏 -> 列表锚点）：
  - 点击 **本周上新**：切到实践模式并筛选近 7 天（`mode=practices&window=7d`）
  - 点击 **案例数量**：切到实践模式（`mode=practices`）
  - 点击 **精选 Skill / 下载总量**：切到 Skill 模式（移除 `mode=practices`）
  - 以上点击统一平滑滚动到首页筛选条锚点（`#skill-list`）
- 2026-02-20：补充本期 SEO 并行优化（用于后续复盘）：
  - 首页首屏“更新看板”改为 **SSR 首屏可见内容**（默认首页 + PC），避免爬虫只抓到骨架
  - 首页 metadata 按“默认页/参数页”分流：默认页可索引，参数页 `noindex,follow`，canonical 统一根路径
  - 详情页仅收录 `is_listed=true` 内容，并补齐 OG/Twitter/结构化数据
  - `robots.txt` 增加 `Host`；`sitemap.xml` 首页增加动态 `lastModified`

---

## 背景

当前首页能完成“首次浏览”，但回访动机弱，主要问题：

1. 用户看完即走，缺少“下次还要来”的理由
2. 站点持续上新实践，但用户缺少“我回来能看到什么”的确定性预期
3. 首屏 Banner 信息量偏少，未承担“更新看板 + 快速入口”的职责

> 约束说明：订阅/推送能力（邮件、站内通知）本期暂不做。

---

## 目标

### 业务目标

1. 建立“每周都有内容变化”的用户预期，提升回访动机
2. 提升首页首屏到实践详情页的点击效率
3. 提升用户 7 日回访率

### 用户目标

1. 打开首页后 3 秒内知道站点“规模”和“近期活跃度”（KPI）
2. 能快速切换查看“本周精选”和“热门内容”
3. 低成本进入一份“当前值得看”的清单

---

## 设计与交互约束（必须与视觉稿一致）

1. **首屏严格一屏**：Banner 不得超出首屏（不得出现首屏就露出第二屏内容）
2. **固定 Header 不遮挡内容**：首屏内容必须避让 fixed header，首行文字不被遮挡
3. **Logo + Slogan 保持线上风格**：仅调整布局位置，不改造字体/渐变/强调样式
4. **hover 仅高亮**：所有可交互卡片/按钮/Tab 的 hover 不做上浮、不做阴影加深；仅允许边框/下划线高亮
5. **动效性能**：轮播/过渡只使用 `transform/opacity`；支持 `prefers-reduced-motion`

---

## 功能范围（本期）

### 1) 首页首屏 Banner（P0）

#### 1.1 信息架构与布局

桌面端为左右两列，并且 Banner 严格一屏：

```
┌────────────────────────────── 首屏（100vh） ──────────────────────────────┐
│ 固定 Header（悬浮）                                                       │
│                                                                            │
│ 左侧：Logo + Slogan + KPI（2x2）                                           │
│  - KPI：案例数量 / 本周上新 / 精选 Skill / 下载总量                         │
│                                                                            │
│ 右侧：榜单模块（合并“每周精选 + 热门榜单”）                                 │
│  - Tab：每周精选 | 热门榜单（active 为橙色 + 下划线）                       │
│  - 轮播：每页 3 条（prev/next + dots）                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

本期仅改 PC。移动端首页不做结构改造，继续沿用现有版本。

#### 1.2 左侧：关键数据（KPI）

KPI 固定 4 项，每项结构统一：

- 标题（label）
- 主数字（value）
- 口径提示（hint，例如“全站累计 / 近 7 天更新”）

**KPI 项与口径建议：**

1. **案例数量**：站点已收录实践/案例总数（`practices.count`）
2. **本周上新**：近 7 天内新增或更新的实践数量（`updated_at >= now-7d`）
3. **精选 Skill**：被标记为精选/推荐的 Skill 数量（若无字段，可先用“已收录 Skill 总量”替代）
4. **下载总量**：全站累计下载量（若无口径，可先展示“安装/复制命令次数”等可用指标替代）

**数字展示规范（与视觉统一，强约束）：**

- 只展示完整数字，使用千分位逗号分割（例如 `50,000`）
- 不使用 `K+ / 万+ / +` 等缩写或模糊表达
- 若某项暂时无法提供真实数据，前端展示 `—`（同时在开发侧尽快补齐真实口径）

#### 1.2.1 KPI 点击导航（新增，P0）

KPI 卡片可点击，作为“首屏导流入口”，点击后统一滚动到列表筛选条（`#skill-list`）：

1. 点击 **本周上新**
   - 切换到实践模式
   - 写入时间窗口筛选 `window=7d`
   - 默认按“最新”排序（`sort=recent`）
2. 点击 **案例数量**
   - 切换到实践模式
   - 清除 `window`（展示实践全量）
3. 点击 **精选 Skill**
   - 切换到 Skill 模式
   - 清除 `mode=practices` 与 `window`
4. 点击 **下载总量**
   - 与“精选 Skill”一致：切换到 Skill 模式，清除 `mode=practices` 与 `window`

交互补充：

- 点击后 URL 必须同步（可刷新、可分享、可前进后退）
- 滚动需考虑 fixed header 避让，锚点落位不能被顶部导航遮挡

#### 1.3 右侧：榜单模块（Tab + 轮播）

**Tab：**

- Tab1：每周精选（默认选中）
- Tab2：热门榜单
- 视觉：active 文案为纯橙色，且下划线为纯橙色；不展示 Tab icon；不使用 Tab 外层“套娃容器”

**轮播：**

- 每个 Tab 内为轮播列表
- **每页固定展示 3 条**
- 支持上一页/下一页按钮 + dots 指示

**条目卡片（每条）字段（与视觉一致）：**

- `title`：标题
- `summary`：摘要
- `source`：来源（左下角文案：`来自 xxx`）
- `skills[]`：关联 Skill（右下角橙色 chip，至少展示 1 个）

**对齐要求：**

- “每周精选”与“热门榜单”的条目卡片结构与样式 **完全对齐**
- **热门榜单不展示排名**（不显示 #1/#2/#3 等）
- 本期不展示 `NEW` 角标

#### 1.4 内容策略（数据不足时的兜底）

1. 每周精选：
   - 优先：`is_featured=true`
   - 不足：用“近 7 天更新 + 高点击”补齐
2. 热门榜单：
   - 默认统计窗口：近 7 天（建议接口支持 `window=7d`）
   - 排序建议：`click_count DESC`，同分按 `updated_at DESC`
3. 数量约束：
   - 每个 Tab 默认拉取 `limit=9`（轮播 3 页 * 每页 3 条）
   - 若不足 9 条：按实际条数渲染，轮播控制（dots/按钮）需自动降级（例如仅 1 页则禁用 prev/next）

---

## 接口与数据需求（P0）

### 1) 榜单数据

1. 每周精选：复用 `/api/practices/featured`
2. 热门榜单：新增或扩展接口（建议 `/api/practices/hot` 或 `/api/practices?sort=hot&window=7d`）
3. 实践列表：`/api/practices` 增加可选参数 `window=7d`（仅用于 KPI“本周上新”入口）

**返回字段建议（最小集）：**

- `id`
- `title`
- `summary`
- `updated_at`
- `source_name`（用于“来自 xxx”）
- `skills`（字符串数组，用于右下角 chip）

**`/api/practices` 增量参数约束：**

- `window`：当前仅支持 `7d`；其它值按未传处理
- `window=7d` 口径：`updated_at >= now-7d`

### 2) KPI 聚合数据

建议新增聚合接口：`/api/home/metrics`，用于一次性返回 4 项 KPI：

- `practice_total`
- `practice_weekly_new`
- `skill_featured_total`（或 `skill_total` 作为兜底）
- `download_total`

> 说明：KPI 与榜单数据尽量都走真实数据口径；视觉稿里的数字仅为示例。

---

## 埋点需求（P1，建议同步做）

1. `home_board_tab_switch`
   - 字段：`tab`（weekly_featured | hot）
2. `home_board_carousel_nav`
   - 字段：`tab`、`direction`（prev | next）、`to_index`
3. `home_board_entry_click`
   - 字段：`tab`、`practice_id`、`position`（条目在当前 Tab 的位置，从 1 开始）
4. `home_kpi_click`
   - 字段：`key`（practice_weekly_new | practice_total | skill_featured_total | download_total）

---

## SEO 优化（本期补充）

> 说明：本节用于记录 v1.5.7 已落地的 SEO 技术项，便于后续复盘与回归检查。

### 1) 首屏可抓取内容（P0）

1. 首页“更新看板”在默认首页（`/`）的 PC 场景走 SSR 预取
2. 爬虫首屏可直接读取：
   - KPI 数字文案（非骨架）
   - 每周精选/热门榜单标题、摘要、来源、Skill 名称（非骨架）
3. 客户端 hydration 后继续保留现有交互（Tab 切换、轮播、点击埋点）

### 2) Metadata 策略（P0）

1. 全站根布局补充标准 metadata：
   - title template / description / keywords / robots
   - Open Graph / Twitter 默认分享信息
2. 首页 metadata 策略：
   - 默认首页：`index,follow`
   - 参数页（`mode/q/tag/window/ids` 等筛选态）：`noindex,follow`
   - canonical 固定 `/`，避免参数页重复收录
3. 详情页 metadata 策略：
   - 动态 title/description/keywords
   - canonical 指向详情真实路径
   - 仅 `is_listed=true` 可访问并可收录（未上架直接 404）

### 3) 结构化数据（P0）

1. 全站注入：
   - `Organization`
   - `WebSite`（含 `SearchAction`）
2. 详情页注入：
   - `SoftwareApplication`
   - `BreadcrumbList`

### 4) 抓取入口与索引信号（P0）

1. `robots.txt`
   - 允许抓取站点页面
   - 禁止抓取 `/api/` 与 `/auth/`
   - 增加 `Host` 与 `Sitemap` 声明
2. `sitemap.xml`
   - 首页 `lastModified` 按实践最新更新时间动态生成
   - 详情页仅输出已上架 Skill

---

## 验收标准

### 首屏与布局

- [ ] Banner 严格一屏（桌面端不得超出首屏）
- [ ] fixed header 不遮挡首屏内容（首行文字/Tab 不被盖住）
- [ ] 桌面端左右两列：左侧品牌 + 4 项 KPI；右侧 Tab + 轮播（每页 3 条）
- [ ] 移动端保持现状（本期不做结构与样式改造，确保无回归）

### KPI

- [ ] KPI 固定 4 项，均展示 label/value/hint
- [ ] KPI 数字使用千分位逗号，且不展示 `K+ / 万+ / +`
- [ ] KPI 卡片可点击，并按约定触发模式切换/时间窗口筛选
- [ ] KPI 点击后自动滚动至 `#skill-list`，且落位不被 fixed header 遮挡

### 右侧榜单

- [ ] Tab：每周精选/热门榜单；active 为橙色文字 + 橙色下划线；无 icon；无外层套娃容器
- [ ] 轮播：prev/next + dots 可用；每页固定 3 条
- [ ] 每周精选与热门榜单条目样式完全一致
- [ ] 热门榜单不展示排名；本期不展示 `NEW`

### 交互与动效

- [ ] hover 仅边框/下划线高亮，不做上浮/阴影变化
- [ ] 轮播切换使用 `transform/opacity`，支持 `prefers-reduced-motion`

### SEO（本期补充）

- [ ] 默认首页首屏 HTML 可直接抓取 KPI 与榜单文本（非骨架占位）
- [ ] 首页参数页为 `noindex,follow`，且 canonical 统一为根路径
- [ ] 详情页仅 `is_listed=true` 可访问并可索引（未上架返回 404）
- [ ] 首页与详情页均输出 OG/Twitter 元数据，分享图正常
- [ ] 结构化数据可被抓取：全站 `Organization/WebSite`、详情 `SoftwareApplication/BreadcrumbList`
- [ ] `robots.txt` 含 `Host` 与 `Sitemap`，`sitemap.xml` 首页带 `lastModified`

---

## 非本期范围

1. 订阅/推送（邮件订阅、站内通知、Webhook）
2. 个性化推荐流（基于用户画像）
3. 更复杂的热度增量统计体系（按日聚合、去重、反作弊等）
4. 完整 A/B 实验平台

---

## 风险与应对

1. **风险：首屏信息过多导致视觉噪音**
   - 应对：KPI 固定 4 项；右侧仅 2 个 Tab；不增加第三个榜单入口
2. **风险：热门榜单口径被误解**
   - 应对：接口明确 `window=7d`；必要时在热门 Tab 增加“近 7 天”轻提示（不强制）
3. **风险：KPI 口径或更新时间引发质疑**
   - 应对：每个 KPI 下方必须有口径 hint；接口可选返回 `metrics_updated_at` 供后续展示

---

## 交付物（本仓库）

- PRD：`docs/1.5.7_home-retention/requirements.md`
- 静态视觉 Mockup：`docs/1.5.7_home-retention/mockup/index.html`
