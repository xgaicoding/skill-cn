# SkillCN（MVP）技术方案设计（Codex）

版本：v0.1  
日期：2026-01-13  
作者：TBD  

## 0. 说明
- 本文基于 `docs/requirements.md` 与 `docs/研发沟通.md` 的澄清结论。
- GitHub Issue 仓库地址暂未确定，后续补充为配置项。
- GitHub Token 仅通过环境变量注入（如 `GITHUB_TOKEN`），不写入仓库/文档/日志。
- 视觉设计参考视觉稿：`docs/mockup`。

## 1. 目标与范围
### 1.1 目标
- 支撑 SkillCN MVP “发现 → 详情 → 提交 → 收录 → 实践 → 热度排序”闭环。
- 提供稳定的 GitHub 信息拉取、目录 ZIP 下载、实践点击统计能力。

### 1.2 范围
- 前台页面（目录/详情/登录/提交跳转）
- 后端 API（列表、详情、计数、下载、精选实践）
- 数据存储（Supabase Postgres）
- GitHub 数据拉取与 ZIP 打包

### 1.3 非范围
- 后台审核/编辑系统
- 评分/评论、榜单、在线试用
- 内容安全校验
- 多语言与移动端适配（MVP 暂不做）

## 2. 已确认口径（摘要）
- GitHub 信息拉取：首次录入拉取；详情页访问同步拉取并更新缓存（超时 5s 回退缓存）；首页只读缓存。
- 拉取失败：首次录入失败则不落库；详情页拉取失败返回缓存。
- updated_at：默认分支下，取该目录及子目录任意文件的最新 commit 时间。
- source_url：仅 GitHub 公共仓库，开发默认分支口径；校验 `SKILL.md` 存在。
- SKILL.md 渲染：出现任何非 http(s) 链接（含 `#anchor`、`mailto`、相对路径）即降级纯文本。
- 下载 ZIP：仅打包 source_url 对应目录（默认分支）。
- 搜索：简单模糊匹配（substring/ILIKE），不区分大小写；不支持多关键词。
- 热度：不为空，使用缓存计算。
- Banner：不足 3 条仍展示并轮播现有条数。
- Stars/点击/下载展示：千位缩写，四舍五入保留 1 位小数（如 1.0k）。
- 计数：点击/下载每次 +1，不去重。

## 3. 技术栈
- 前端/服务端：Next.js（App Router）
- 数据库：Supabase Postgres
- 图标库：lucide-react
- 部署：Vercel
- GitHub API：Octokit / fetch（参考 `docs/research/github/*.mjs`）

## 4. 系统架构
```
Browser
  -> Next.js UI (App Router)
  -> Route Handlers (/api/*)
       -> Supabase (Postgres)
       -> GitHub API
       -> ZIP Packager (Server)
```

- 前端负责展示、筛选/排序/分页、触发下载与点击统计。
- 后端 Route Handlers 负责数据查询、GitHub 拉取、ZIP 打包、计数更新。

## 5. 数据模型（Supabase / Postgres）
### 5.1 skills
- `id` SERIAL PK
- `name` TEXT NOT NULL
- `description` TEXT NOT NULL
- `tag` TEXT NOT NULL CHECK IN (研究/编程/写作/数据分析/设计/生产力)
- `source_url` TEXT NOT NULL
- `is_listed` BOOLEAN NOT NULL DEFAULT true
- `download_count` BIGINT NOT NULL DEFAULT 0
- `practice_count` INT NOT NULL DEFAULT 0  -- 仅统计 is_listed = true 的实践
- `heat_score` NUMERIC NOT NULL
- `repo_stars` INT NOT NULL
- `repo_owner_name` TEXT
- `repo_owner_avatar_url` TEXT
- `updated_at` TIMESTAMP NOT NULL  -- Skill 目录最新 commit 时间
- `markdown` TEXT
- `markdown_render_mode` TEXT NOT NULL DEFAULT 'markdown'  -- markdown | plain
- `created_at` TIMESTAMP NOT NULL DEFAULT now()
- `updated_at_sys` TIMESTAMP NOT NULL DEFAULT now()

索引建议：
- `(is_listed, tag)`
- `(heat_score DESC, updated_at DESC, repo_stars DESC, id ASC)`
- `(updated_at DESC, heat_score DESC, repo_stars DESC, id ASC)`
- `ILIKE` 搜索：可用 `GIN (to_tsvector)` 或简单索引 + 低量数据直接扫描（MVP 可先走 ILIKE）

### 5.2 practices
- `id` SERIAL PK
- `skill_id` INT NOT NULL REFERENCES skills(id)
- `title` TEXT NOT NULL
- `summary` TEXT NOT NULL
- `channel` TEXT NOT NULL CHECK IN (飞书文档/公众号/知乎/小红书/其他)
- `updated_at` DATE NOT NULL
- `source_url` TEXT NOT NULL
- `author_name` TEXT
- `is_listed` BOOLEAN NOT NULL DEFAULT true
- `featured_rank` INT NULL CHECK (featured_rank BETWEEN 1 AND 6)
- `click_count` BIGINT NOT NULL DEFAULT 0
- `created_at` TIMESTAMP NOT NULL DEFAULT now()
- `updated_at_sys` TIMESTAMP NOT NULL DEFAULT now()

索引建议：
- `(skill_id, is_listed, updated_at DESC)`
- `(featured_rank ASC, is_listed, updated_at DESC)`

## 6. GitHub 集成
### 6.1 URL 解析
- 仅接受 `github.com` 域名。
- 解析 `owner/repo`，若 URL 包含 `/tree/<ref>/path` 或 `/blob/<ref>/path`，保留 path。
- 开发口径统一使用仓库默认分支（忽略非默认分支）。
- 参考：`docs/research/github/demo.mjs`。

### 6.2 拉取项
- repo 基本信息：stars、owner
- owner 显示名与头像
- 目录最新 commit：使用 commits API + `path=<skill_path>` + `per_page=1`
- SKILL.md 内容：contents API

### 6.3 拉取策略
- 录入时必须拉取成功，否则拒绝入库。
- 详情页访问触发同步拉取，超时阈值 5s；成功后更新缓存；超时或失败返回缓存。
- 首页仅读缓存，不触发拉取。

### 6.4 SKILL.md 渲染策略
- 默认 Markdown 渲染（支持标题/列表/表格/代码块语法高亮）。
- 若检测到任意链接或图片的 URL 不以 `http://` 或 `https://` 开头（包括 `#anchor`、`mailto:`、相对路径），则降级纯文本展示。

实现建议：
- 使用正则检测 Markdown 中的链接/图片 URL。
- 命中非 http(s) 即标记 `markdown_render_mode = plain`。

## 7. ZIP 下载（目录打包）
- 输入：Skill `id` → 解析 `source_url` → owner/repo/path
- 仅支持目录；若为仓库根目录则打包整仓。
- 打包流程：
  1. 使用 `https://codeload.github.com/{owner}/{repo}/zip/{default_branch}` 下载仓库 zip
  2. 解压后截取目标目录
  3. 重新打包为 zip 并返回
- 参考：`docs/research/github/dir-zip.mjs`

计数口径：
- 用户点击“下载 ZIP”即通过计数接口 `download_count +1`，不依赖下载是否成功。

## 8. API 设计（Route Handlers）
### 8.1 列表与详情
- `GET /api/skills`
  - query: `page`, `size`, `tag`, `q`, `sort`
  - 默认每页 12 条
  - 仅返回 `is_listed = true`
  - `sort`: `heat` | `recent`

- `GET /api/skills/[id]`
  - 返回 skill 基础信息
  - 触发 GitHub 拉取并同步缓存（超时 5s 回退缓存）

- `GET /api/skills/[id]/practices`
  - 返回实践列表（分页，默认 12 条/页）
  - query: `page`, `size`

### 8.2 Banner 与实践
- `GET /api/practices/featured`
  - `featured_rank` 有值且 `is_listed = true`
  - 不足 3 条仍返回全部

- `POST /api/practices/[id]/click`
  - `click_count +1`

### 8.3 下载
- `GET /api/skills/[id]/download`
  - 返回 zip stream

- `POST /api/skills/[id]/download-count`
  - 触发 `download_count +1`（点击即计）

## 9. 前端交互实现要点
- 首页分页：每页 12 条；分页状态不需要写入 URL。
- 切换筛选/排序/搜索后，自动重置到第一页。
- Banner：轮播展示 3–6 条，不足 3 条仍展示并轮播现有条数。
- 详情页实践列表：分页 12 条/页。
- ID 不对外展示（不提供复制交互）。

## 10. Supabase 接入
- 使用 Supabase JS SDK（服务端使用 `service_role_key`）。
- 数据写操作仅在服务端 Route Handlers 中执行。
- 可选：使用 Supabase Auth 进行 GitHub OAuth 登录。

## 11. 登录与提交入口
- GitHub OAuth 登录（Supabase Auth 或 NextAuth 皆可，优先 Supabase Auth）。
- `提交 Skill` / `提交实践` 按钮需登录后跳转 GitHub Issue。
- Issue 仓库地址与模板为配置项（暂用占位链接，后续替换）。

## 12. 错误处理与降级
- GitHub 拉取失败：返回缓存；若无缓存则提示“内容加载失败/条目不存在”。
- 下载失败：提示失败并提供 `source_url` 跳转。
- source_url 无效：阻止录入。

## 13. 环境变量
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN`（可选，避免 GitHub API 限流）
- `ISSUE_REPO_URL`（默认占位：`https://github.com/your-org/your-repo/issues/new/choose`）
- `ISSUE_TEMPLATE_SKILL` / `ISSUE_TEMPLATE_PRACTICE`（待补充）

## 14. 部署
- Vercel 部署 Next.js
- Supabase 作为外部托管数据库
- GitHub Token 与 Supabase key 通过 Vercel 环境变量注入
