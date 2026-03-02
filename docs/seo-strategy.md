# skill-cn SEO 策略文档

> 最后更新：2026-02-21

## 一、Programmatic SEO 落地方案

### 1.1 核心思路

skill-cn 天然适配 Programmatic SEO：47 个 Skill × 多场景 × 157+ 篇实践案例 = 结构化数据 + 长尾关键词矩阵。

对标 Zapier 三层架构，用模板 + 数据自动生成大量高质量页面，覆盖长尾搜索流量。

### 1.2 三层页面架构

#### Tier 1：Skill Profile Pages（47+ 页）

每个 Skill 一个详情页。

**页面内容**：
- Skill 简介 + 官网链接
- 关联实践案例列表（按热度/时间排序）
- 使用场景标签
- 热度趋势（案例增长曲线）
- 相关 Skill 推荐
- FAQ 区块（"XX 是什么？""XX 怎么用？""XX 和 YY 的区别？"）

**目标关键词**：
- "[Skill名] 是什么"
- "[Skill名] 怎么用"
- "[Skill名] 教程"
- "[Skill名] 使用指南"

**Schema**：SoftwareApplication + FAQ

#### Tier 2：Skill × 场景组合页（数百页）

每个有意义的 Skill × 场景组合一个页面。

**页面内容**：
- 场景描述 + 为什么用这个 Skill
- 该场景下的实践案例集合
- 操作步骤摘要（从案例中提炼）
- 常见问题 + 踩坑记录
- 相关组合推荐（同 Skill 不同场景 / 同场景不同 Skill）

**目标关键词**：
- "用 [Skill] 做 [场景]"
- "[Skill] [场景] 教程"
- "[Skill] [场景] 实战"

**Schema**：Article + HowTo

**生成规则（条件生成，不是无脑生成）**：
- 该组合下至少有 2 篇实践案例才生成页面
- 页面内容独特性 > 60%（不同组合的案例集合不同）
- 无案例支撑的组合不生成，避免薄内容

#### Tier 3：实践案例详情页（157+ 页，持续增长）

每篇实践案例独立页面（已有）。

**页面内容**：
- AI 生成的营销风格摘要（非原文复制，保证独特性）
- 关联 Skill 标签
- 原文链接
- 相关实践推荐

**Schema**：Article

### 1.3 扩展节奏

| 阶段 | 时间 | 内容 | 监控指标 |
|------|------|------|----------|
| Phase 1 | 1-2 周 | Tier 1（47 Skill 页）+ 优化现有 Tier 3 | 索引率 >70% |
| Phase 2 | 3-4 周 | Tier 2（先做 Top 50 组合页） | 参与度 vs 站点平均 |
| Phase 3 | 持续 | 随案例增长自动扩展 Tier 2/3 | 全站自然流量趋势 |

**关键原则**：
- 每月扩展不超过 50%
- 任何黄灯信号出现立即暂停
- 索引率 <40% 时停止扩展并修复

### 1.4 内链策略

```
首页
├── Skill 列表页（Hub）
│   ├── Skill 详情页（Tier 1）
│   │   ├── Skill × 场景组合页（Tier 2）
│   │   │   └── 实践案例详情页（Tier 3）
│   │   └── 实践案例详情页（Tier 3）
│   └── ...
└── 实践列表页（Hub）
    └── 实践案例详情页（Tier 3）
```

- 每个 Tier 3 页面链回 Tier 1（Skill 详情）和 Tier 2（场景组合）
- 每个 Tier 2 页面链回 Tier 1 + 链向相关 Tier 2
- 每个 Tier 1 页面链向所有相关 Tier 2 和热门 Tier 3
- 任何页面 ≤3 次点击可达首页

### 1.5 关键词矩阵示例

| Head Term | Modifier | 示例页面 | 预估搜索量 |
|-----------|----------|----------|-----------|
| [Skill] 是什么 | Skill 名 | "Cursor 是什么" | 中 |
| [Skill] 教程 | Skill 名 | "Claude Code 教程" | 中-高 |
| 用 [Skill] 做 [场景] | Skill × 场景 | "用 Cursor 做前端开发" | 低-中 |
| [Skill] vs [Skill] | Skill 对比 | "Cursor vs Copilot" | 中 |
| AI [场景] | 场景 | "AI 自动化测试" | 中 |

---

## 二、Technical SEO 行动清单

### 2.1 已完成 ✅

- [x] SSR 首屏直出（Next.js 14）
- [x] SEO metadata 全套
- [x] 结构化数据基础
- [x] robots.txt + sitemap.xml
- [x] PC/Mobile 双套 UI（响应式）
- [x] HTTPS

### 2.2 待做 📋

**P0（本周）**：
- [ ] 用 PageSpeed Insights 实测所有页面模板的 Core Web Vitals
- [ ] 检查 TTFB（目标 <200ms）
- [ ] 验证 sitemap 包含所有实践案例页面 URL
- [ ] 注册 Google Search Console，提交 sitemap，监控索引覆盖率

**P1（下周）**：
- [ ] 为实践案例页添加 Article + HowTo schema
- [ ] 为 Skill 页添加 SoftwareApplication schema
- [ ] 检查并启用 Brotli 压缩
- [ ] 优化图片（WebP 格式 + 懒加载 + 尺寸预设防 CLS）

**P2（本月）**：
- [ ] 建立内链自动化（案例 ↔ Skill ↔ 场景组合页）
- [ ] 设置 CI 检查防止 SEO 回退（canonical、robots、redirect）
- [ ] 分段 sitemap（按 Skill/实践/组合页分组）
- [ ] 添加 breadcrumb 导航 + Breadcrumb schema

### 2.3 Core Web Vitals 目标

| 指标 | 目标 | 说明 |
|------|------|------|
| LCP | < 2.5s | 预加载首屏图片，SSR 直出 |
| INP | < 200ms | 减少主线程工作，延迟非关键 JS |
| CLS | < 0.1 | 图片/广告预留空间，字体 swap |

### 2.4 AI 搜索优化（SGE / Perplexity / ChatGPT）

- 实践案例页提供清晰的"步骤式"内容结构（适合 AI 提取）
- 每个页面有结构化摘要（前 200 字回答核心问题）
- Schema markup 帮助 AI 理解实体关系
- FAQ 区块增加被 AI 引用的概率

---

## 三、监控指标

| 指标 | 工具 | 频率 | 目标 |
|------|------|------|------|
| 索引覆盖率 | Google Search Console | 每周 | >70% |
| 自然搜索流量 | Google Analytics | 每周 | 月环比增长 |
| Core Web Vitals | PageSpeed Insights | 每月 | 全部通过 |
| 页面参与度 | GA（停留时长/跳出率） | 每周 | 停留 >1 分钟 |
| 关键词排名 | Search Console | 每周 | Top 10 关键词数增长 |
| 爬虫效率 | Search Console Crawl Stats | 每月 | >50% |

---

## 四、Link Building 策略

> 新增：2026-02-22

### 4.1 当前阶段：冷启动期 Link Building

skill-cn 是新域名，DR 低，需要从基础做起。

#### Phase 1：基础链接建设（立即开始）

**目标**：建立品牌在线存在，获取 foundational links

| 平台 | 操作 | 链接类型 |
|------|------|----------|
| GitHub | 完善 README + 项目描述 + 网站链接 | Profile + Repo |
| 掘金 | 发布技术文章，文末引导到 skill-cn | 内容链接 |
| 知乎 | 回答 AI 工具相关问题，引用 skill-cn 案例 | 内容链接 |
| V2EX | 分享实践案例，自然提及 skill-cn | 社区链接 |
| 少数派 | 投稿 AI 工具实践文章 | 内容链接 |
| ProductHunt | 产品上线时提交 | 目录链接 |

#### Phase 2：可链接资产创建（1-2 个月内）

**资产 1：AI Skill 热度趋势报告**
- 基于 skill-cn 数据：哪些 Skill 最热门、增长最快、最多实践案例
- 每月/每季度更新
- 目标：被科技媒体和开发者博客引用

**资产 2：「AI 实践方案」系列指南**
- 针对热门场景的深度指南（如"用 AI 做前端开发完全指南"）
- 包含多个 Skill 的对比和实践案例
- 目标：成为该场景的权威参考

**资产 3：免费工具（中期）**
- AI Skill 推荐器：输入场景/需求 → 推荐 Skill + 实践案例
- 目标：工具本身吸引自然链接

#### Phase 3：主动外展（有内容基础后）

- 研究竞品（skills.sh 等）的反向链接来源
- 找到引用竞品的文章 → 联系作者请求也提及 skill-cn
- 为开发者博客/媒体提供 AI 工具使用数据（HARO 式）
- 在技术社区建立关系，不急于求链接

### 4.2 Link Building 监控指标

| 指标 | 工具 | 目标 |
|------|------|------|
| Domain Rating (DR) | Ahrefs | 6 个月内达到 20+ |
| 月新增 Referring Domains | Ahrefs / Search Console | 10+/月 |
| 反向链接质量 | 手动审计 | 相关性 + 权威性 |
| 竞品链接差距 | Ahrefs Content Gap | 持续缩小 |

---

## 五、Content SEO 执行指南

> 新增：2026-02-22

### 5.1 关键词研究流程

```
种子关键词 → 工具扩展 → 搜索意图分类 → 聚类 → Business Potential 评分 → 优先级排序
```

**skill-cn 种子关键词**：
- Skill 名称：Cursor、Claude Code、Copilot、v0、Bolt、Lovable...
- 场景词：AI 编程、AI 前端、AI 自动化测试、AI 写代码...
- 长尾组合："用 Cursor 做前端"、"Claude Code 教程"、"AI 编程工具对比"...

**Business Potential 评分标准**：
- 3 分：直接匹配 skill-cn 现有 Skill + 有实践案例（如 "Cursor 前端开发教程"）
- 2 分：匹配现有 Skill 但案例较少（如 "Bolt 部署指南"）
- 1 分：相关但不直接匹配（如 "AI 编程趋势"）
- 0 分：无关（如 "Python 基础教程"）

### 5.2 搜索意图匹配矩阵

| 页面类型 | 主要意图 | 内容格式 | Schema |
|----------|----------|----------|--------|
| Skill 详情页 | 信息型 | 简介 + 案例列表 + FAQ | SoftwareApplication + FAQ |
| Skill × 场景组合页 | 信息型 + 商业型 | 操作指南 + 案例集合 | Article + HowTo |
| 实践案例详情页 | 信息型 | 摘要 + 步骤 + 成果 | Article |
| Skill 对比页（未来） | 商业型 | 功能对比 + 场景推荐 | Article + FAQ |

### 5.3 On-Page SEO 模板

每个页面发布前检查：

- [ ] Title Tag：含目标关键词，50-70 字符，关键词靠前
- [ ] Meta Description：含关键词，160 字符内，有行动号召
- [ ] URL：短、含关键词、无日期
- [ ] H1：含目标关键词，与 Title Tag 略有不同
- [ ] H2/H3：覆盖主要子话题
- [ ] 首段：前 100 字包含目标关键词
- [ ] 内链：3-6 个指向相关页面
- [ ] 外链：引用权威来源
- [ ] 图片：压缩 + 描述性 alt text
- [ ] Schema Markup：根据页面类型添加
- [ ] Canonical URL：自引用
- [ ] 内容差距：对比 Top 10 补充缺失子话题

### 5.4 AI 搜索优化要点（2026 新趋势）

- 声明式句子 + 关键观点前置（适合被 AI 引用）
- 全面覆盖子话题（ChatGPT 的 query fan-out 机制）
- 结构化内容（清晰的 H2/H3 层级）
- Schema Markup（Google 和 Microsoft 确认对 AI 搜索重要）
- E-E-A-T 信号（专家引用、一手经验、原创数据）
