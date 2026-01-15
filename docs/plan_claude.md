# SkillCN MVP 技术方案（最终版）

版本：v1.1.0
日期：2026-01-13
基于：requirements.md + 研发沟通.md + Claude/Codex 方案澄清

---

## 1. 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | Next.js 14 (App Router) | 全栈框架，SSR 支持 |
| 数据库 | Supabase (PostgreSQL) | 托管数据库 + Auth |
| 认证 | Supabase Auth (GitHub OAuth) | 内置 OAuth 支持 |
| 样式 | Tailwind CSS | 原子化 CSS |
| 图标 | lucide-react | 图标库 |
| Markdown | react-markdown + rehype-highlight | 渲染 + 代码高亮 |
| GitHub API | @octokit/rest | 官方 SDK |
| 部署 | Vercel | 自动部署 |

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Next.js App                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │ │
│  │  │   Pages     │  │ API Routes  │  │  Server Actions │  │ │
│  │  │  (SSR)      │  │  /api/*     │  │                 │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    ┌─────────────┐      ┌─────────────┐
    │  Supabase   │      │  GitHub API │
    │  (DB+Auth)  │      │  (Octokit)  │
    └─────────────┘      └─────────────┘
```

---

## 3. 数据库设计

### 3.1 skills 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键，自增 |
| name | VARCHAR(200) | Skill 名称 |
| description | TEXT | 简短描述 |
| tag | VARCHAR(20) | 标签枚举 |
| source_url | TEXT | GitHub 目录链接 |
| is_listed | BOOLEAN | 是否上架，默认 false |
| download_count | INTEGER | 下载次数，默认 0 |
| repo_stars | INTEGER | 仓库 Stars（缓存） |
| repo_owner_login | VARCHAR(100) | 作者 login（缓存） |
| repo_owner_name | VARCHAR(200) | 作者展示名（缓存） |
| repo_owner_avatar_url | TEXT | 作者头像（缓存） |
| updated_at | TIMESTAMPTZ | 目录最新 commit 时间（缓存） |
| skill_md | TEXT | SKILL.md 原始内容（缓存） |
| skill_md_render_mode | VARCHAR(20) | 渲染模式：`markdown` / `plain`，默认 `markdown` |
| practice_count | INTEGER | 实践数量（触发器维护），默认 0 |
| heat_score | NUMERIC(10,2) | 热度分（触发器维护），默认 0 |
| created_at | TIMESTAMPTZ | 创建时间，默认 now() |
| updated_at_sys | TIMESTAMPTZ | 记录更新时间，默认 now() |
| github_synced_at | TIMESTAMPTZ | GitHub 最后同步时间 |

**约束**：
- `tag` 枚举：`研究`、`编程`、`写作`、`数据分析`、`设计`、`生产力`
- `skill_md_render_mode` 枚举：`markdown`、`plain`

**索引**：
- `is_listed`
- `tag`
- `(heat_score DESC, updated_at DESC, repo_stars DESC, id ASC)` — 热度排序
- `(updated_at DESC, heat_score DESC, repo_stars DESC, id ASC)` — 时间排序

### 3.2 practices 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键，自增 |
| skill_id | INTEGER | 外键 → skills.id |
| title | VARCHAR(200) | 标题 |
| summary | TEXT | 实践简介 |
| channel | VARCHAR(20) | 渠道枚举 |
| updated_at | DATE | 发布/更新时间 |
| source_url | TEXT | 源链接 |
| is_listed | BOOLEAN | 是否上架，默认 false |
| featured_rank | INTEGER | Banner 精选排序 (1-6)，NULL 表示非精选 |
| click_count | INTEGER | 点击量，默认 0 |
| created_at | TIMESTAMPTZ | 创建时间，默认 now() |
| updated_at_sys | TIMESTAMPTZ | 记录更新时间，默认 now() |

**约束**：
- `channel` 枚举：`飞书文档`、`公众号`、`知乎`、`小红书`、`其他`
- `featured_rank`：NULL 或 1-6

**索引**：
- `(skill_id, is_listed, updated_at DESC)`
- `(featured_rank, is_listed)` — Banner 精选查询

### 3.3 触发器

| 触发器 | 说明 |
|--------|------|
| `update_skill_practice_count` | practices 增删改时，更新对应 skill 的 practice_count（仅统计 is_listed=true） |
| `update_skill_heat_score` | practice_count 或 repo_stars 变化时，重算 heat_score |
| `update_updated_at_sys` | 记录更新时自动更新 updated_at_sys |

**热度公式**：`heat_score = practice_count * 1000 + repo_stars * 0.15`

---

## 4. API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills` | Skill 列表（分页/筛选/排序/搜索） |
| GET | `/api/skills/[id]` | Skill 详情（触发 GitHub 同步） |
| GET | `/api/skills/[id]/download` | 下载 Skill ZIP |
| POST | `/api/skills/[id]/download-count` | 增加下载计数（+1） |
| GET | `/api/skills/[id]/practices` | 实践列表（分页，每页 5 条） |
| POST | `/api/practices/[id]/click-count` | 增加点击计数（+1） |
| GET | `/api/featured-practices` | Banner 精选实践 |

### 4.1 列表接口参数 `GET /api/skills`

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| pageSize | number | 每页条数，默认 20 |
| tag | string | 标签筛选（可选） |
| sort | `heat` \| `updated` | 排序方式，默认 heat |
| q | string | 搜索关键词（可选） |

### 4.2 排序规则

**热度排序（sort=heat）**：
`heat_score DESC → updated_at DESC → repo_stars DESC → id ASC`

**时间排序（sort=updated）**：
`updated_at DESC → heat_score DESC → repo_stars DESC → id ASC`

### 4.3 下载流程

```
用户点击"下载"按钮
  → 前端调用 POST /api/skills/[id]/download-count（计数 +1）
  → 前端调用 GET /api/skills/[id]/download（下载 ZIP）
```

---

## 5. 页面结构

```
app/
├── layout.tsx              # 根布局
├── page.tsx                # 首页（目录页）
├── skill/[id]/page.tsx     # 详情页
├── auth/callback/route.ts  # OAuth 回调
└── api/                    # API 路由

components/
├── layout/                 # Header、Footer
├── home/                   # Banner、FilterBar、SkillCard、Pagination
├── skill/                  # SkillInfo、PracticeList、MarkdownRenderer
└── ui/                     # Button、Badge、Skeleton、Toast 等

lib/
├── supabase/               # Supabase 客户端
├── github/                 # GitHub API 封装
├── utils/                  # 工具函数
└── types/                  # 类型定义
```

---

## 6. 核心功能设计

### 6.1 GitHub 信息同步策略

| 时机 | 行为 |
|------|------|
| 首次录入 Skill | 同步拉取所有 GitHub 信息，失败则阻止录入 |
| 访问详情页 | **同步阻塞 + 骨架屏**，超时 **5 秒** 后展示缓存 |
| 首页展示 | 直接读取数据库缓存，不拉取 GitHub |
| GitHub 超时/限流 | 展示数据库缓存数据 |

**拉取内容**：
- 仓库 Stars
- 作者信息（login、name、avatar）
- 目录最新 commit 时间
- SKILL.md 内容 + 渲染模式判断

### 6.2 ZIP 下载流程

1. 解析 `source_url` 得到 owner/repo/path
2. 下载仓库 zipball（使用 codeload.github.com）
3. 解压并提取目标子目录
4. 重新打包为 ZIP 返回

**超时处理**：配置 Vercel Function maxDuration: 60s，失败时提示并引导跳转 source_url

### 6.3 Markdown 渲染规则

**检测方式**：正则表达式匹配（首次拉取时计算，结果存入 `skill_md_render_mode`）

| 检测内容 | 处理方式 |
|----------|----------|
| 包含相对路径（`./`、`../`、`images/xxx`）| `plain`（纯文本） |
| 包含锚点链接（`#anchor`）| `plain`（纯文本） |
| 包含 `mailto:` 链接 | `plain`（纯文本） |
| 纯绝对链接 | `markdown`（渲染，支持代码高亮 + 表格） |

纯文本展示时，底部提供"前往 Source 查看完整内容"链接。

### 6.4 搜索与筛选

- **搜索范围**：name + description + tag
- **匹配方式**：模糊匹配（SQL ILIKE），不区分大小写
- **筛选叠加**：先按标签筛选，再按关键词搜索，取交集
- **切换筛选**：自动重置到第一页

### 6.5 数字格式化

| 原始值 | 展示值 | 规则 |
|--------|--------|------|
| 999 | 999 | < 1000 原样 |
| 1000 | 1.0k | >= 1000 转换 |
| 1249 | 1.2k | 四舍五入 |
| 1250 | 1.3k | 四舍五入 |
| 10000 | 10.0k | 保留 1 位小数 |

适用于：Stars、click_count、download_count（若展示）

---

## 7. 认证方案

- 使用 Supabase Auth 集成 GitHub OAuth
- 登录态由 Supabase 管理，支持持久化
- OAuth 回调失败时返回首页

---

## 8. 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公开 Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端 Key |
| `GITHUB_PAT` | GitHub Personal Access Token |
| `NEXT_PUBLIC_GITHUB_ISSUE_REPO` | Issue 仓库地址（待定） |

---

## 9. 风险与注意事项

| 风险 | 应对措施 |
|------|----------|
| GitHub API 限流（5000次/小时） | 使用 PAT 认证；仅详情页触发同步 |
| GitHub 拉取超时 | 设置 5s 超时，超时后展示缓存 |
| ZIP 下载超时 | 配置 maxDuration: 60s；提供"前往 Source"兜底 |
| 分支删除导致失效 | 展示错误提示，引导跳转 source_url |
| Supabase 免费额度 | MVP 阶段足够，后续按需升级 |

---

## 10. 待确认项

| 项目 | 状态 |
|------|------|
| GitHub Issue 仓库地址 | 待定 |

---

## 附录：澄清结论汇总

| 问题 | 最终结论 |
|------|----------|
| Markdown 渲染模式 | 存库（`skill_md_render_mode` 字段） |
| 下载计数时机 | 点击即 +1（前端先调计数接口） |
| 下载接口方法 | GET 下载 + 单独 POST 计数接口 |
| 详情/实践接口 | 分开（单独实践列表接口） |
| 主键类型 | SERIAL（int） |
| 主键命名 | id |
| 系统更新时间 | 有 `updated_at_sys` 字段 |
| Markdown 检测方式 | 正则表达式 |
| GitHub 拉取方式 | 同步阻塞 + 骨架屏 |
| GitHub 超时阈值 | 5 秒，超时展示缓存 |
| practice_count 统计 | 只统计 is_listed = true |
