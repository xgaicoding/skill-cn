# OpenClaw WSL2 / Codex Tool Calls SEO Page Implementation

> Version: 1.6.0  
> Date: 2026-06-18  
> Owner: 张一鸣  
> Scope: only one SEO page, no generic SEO framework refactor

## 1. Goal

Ship one indexable long-tail SEO page:

`/seo/openclaw-wsl2-codex-tool-calls`

The page targets developers searching for `OpenClaw WSL2`, `Codex tool calls`, `Codex WSL2 Windows`, `OpenClaw Codex harness`, `AGENTS.md Codex`, and `Agent Skills directory`.

This implementation only adds the concrete page and sitemap entry. It does not introduce a reusable SEO CMS, dynamic article system, database table, or cross-site template refactor.

## 2. Route

Add:

- `app/seo/openclaw-wsl2-codex-tool-calls/page.tsx`

Route behavior:

- Static SSR page under Next.js App Router.
- `export const revalidate = 86400` is acceptable because the article is mostly evergreen.
- Main article body must render in server HTML, not behind client-only fetch or interaction.
- No route params and no database dependency.

Canonical URL:

- `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls`

## 3. Component Reuse

Reuse existing site-level pieces when possible:

- `AppHeader` for consistent navigation.
- `AppFooter` for footer and site trust.
- `Link` from `next/link` for internal navigation.
- `getSiteUrl` from `lib/site` for canonical and JSON-LD absolute URLs.

Do not create a new design system. Page-local helper components are allowed inside `page.tsx` when they keep the file readable:

- `Section`
- `InfoCard`
- `Checklist`
- `FaqItem`

Styling options:

- Prefer existing global typography and layout tokens where available.
- Add page-local class names in `app/globals.css` only if inline utility classes are not already used in the project.
- Keep the article readable on mobile; avoid decorative heavy layouts.

## 4. Metadata

Implement `generateMetadata` or static `metadata` in the page file.

Required metadata:

- `title`: `OpenClaw WSL2 与 Codex Tool Calls 排查指南 | skill-cn`
- `description`: `面向 Windows/WSL2 开发者的 OpenClaw + Codex tool calls 实战排查指南：理解 Codex harness、AGENTS.md、Agent Skills、MCP/plugin 工具暴露与常见故障。`
- `alternates.canonical`: `/seo/openclaw-wsl2-codex-tool-calls`
- `robots`: index and follow.
- Open Graph:
  - `type`: `article`
  - `url`: absolute page URL
  - `siteName`: `Skill Hub 中国`
  - image: `/og-cover.png`
- Twitter:
  - `card`: `summary_large_image`
  - image: `/og-cover.png`

## 5. Content Structure

The page content should follow this order.

### 5.1 Hero

H1:

`OpenClaw WSL2 与 Codex Tool Calls 排查指南`

Above-the-fold copy must answer:

- Native Windows is the default path for many Codex Windows users.
- WSL2 is useful when repo, shell, dependencies, CI assumptions, or Linux-native tools already live in WSL2.
- OpenClaw Codex harness and direct Codex CLI runs can expose different tool surfaces.

Add a compact decision table:

| Path | Best For | First Check |
| --- | --- | --- |
| Native Windows | Default Windows Codex workflow | sandbox, working directory, PowerShell commands |
| WSL2 | Linux-native repo and toolchain | distro path, package manager, shell env |
| OpenClaw Codex harness | OpenClaw owns chat/session orchestration, Codex owns coding session | current tool list and session policy |

### 5.2 Mental Model

Explain the layers:

1. Windows or WSL2 runtime.
2. Codex CLI, Codex app, or OpenClaw Codex harness.
3. Tool surfaces: Codex-native tools, OpenClaw dynamic tools, MCP/plugin tools.
4. Instruction layer: `AGENTS.md` and Agent Skills.

Include text diagram:

`User -> OpenClaw chat/session -> Codex harness -> Codex tool calls -> local shell/files/MCP/plugin surfaces`

### 5.3 When To Use WSL2

Cover:

- Repo already lives under Linux path.
- Toolchain expects Linux shell behavior.
- CI or production is Linux-based.
- Native Windows sandbox behavior does not match the project.

Avoid the false claim that WSL2 is always better.

### 5.4 Why Tool Calls Look Broken

Checklist:

- Is this session Codex harness, Codex CLI, Codex app, or another agent runtime?
- Are the expected tools exposed in this turn?
- Is the missing tool Codex-native, OpenClaw dynamic, MCP/plugin, or a Skill workflow?
- Is approval or sandbox policy blocking the action?
- Is the repo path in WSL2 while config points to Windows paths?
- Did `AGENTS.md` or a Skill constrain the action?
- Is the failure caused by missing env vars, credentials, packages, or resources?

### 5.5 AGENTS.md And Agent Skills

Explain:

- `AGENTS.md` is for project/team instructions.
- Agent Skills are reusable workflows with instructions, references, scripts, and assets.
- skill-cn's content model is `Skill x scenario = practice`, so the page should move users from setup troubleshooting to real practice discovery.

### 5.6 Minimal Repro Flow

Publish as an ordered checklist and optional `HowTo` schema:

1. Confirm native Windows or WSL2.
2. Confirm working directory and repo path.
3. Confirm runtime: Codex CLI, Codex app, or OpenClaw Codex harness.
4. Run a harmless file-read or list command.
5. Run a harmless temp file write.
6. Check current dynamic tools, MCP/plugin tools, and Skill availability.
7. Read relevant `AGENTS.md` and selected Skill instructions.
8. Classify exact error: missing tool, permission denial, command failure, timeout, or resource exhaustion.

### 5.7 Recommended Next Practices

Use only existing internal links. Do not publish broken TODO links.

Required internal links:

- `/` with anchor text `AI 编程 Agent 技能目录`
- `/` with anchor text `Agent Skills 实践案例`
- Existing `/skill/[id]` or `/practice/[id]` links if reliable IDs are known from the current database/source.

If no reliable concrete OpenClaw/Codex practice ID is available during implementation, link to `/` and explain users can search skills and practices from the homepage.

### 5.8 FAQ

Include these questions:

1. Codex 在 Windows 上应该用原生还是 WSL2？
2. OpenClaw Codex harness 和直接运行 Codex CLI 有什么区别？
3. 为什么 Codex 看不到 MCP/plugin tools？
4. `AGENTS.md` 和 Agent Skills 谁负责什么？
5. Agent Skills directory 和普通工具目录有什么区别？
6. Tool call 失败时应该先查权限、路径还是工具暴露？

## 6. Outbound Evidence Links

Use official or canonical sources only:

- OpenAI Codex CLI: `https://developers.openai.com/codex/cli`
- OpenAI Codex Windows: `https://developers.openai.com/codex/windows`
- OpenAI AGENTS.md guide: `https://developers.openai.com/codex/guides/agents-md`
- OpenAI Agent Skills: `https://developers.openai.com/codex/skills`
- OpenClaw Codex harness: `https://docs.openclaw.ai/plugins/codex-harness`
- OpenClaw tools overview: `https://docs.openclaw.ai/tools`
- AGENTS.md canonical site: `https://agents.md/`

Outbound links should open normally. Do not add `nofollow` to official documentation links.

## 7. Structured Data

Add JSON-LD scripts in SSR HTML.

Required:

- `Article`
- `FAQPage`

Optional if simple:

- `HowTo`

Use safe serialization:

```ts
function toJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
```

Article fields:

- `@context`: `https://schema.org`
- `@type`: `Article`
- `headline`: `OpenClaw WSL2 与 Codex Tool Calls 排查指南`
- `description`: page meta description
- `author.name`: `Skill Hub 中国`
- `publisher.name`: `Skill Hub 中国`
- `datePublished`: `2026-06-18`
- `dateModified`: `2026-06-18`
- `mainEntityOfPage`: absolute canonical URL

FAQPage:

- Map the six FAQ questions and answers exactly as visible page content.

HowTo:

- Use the eight minimal repro steps.
- Do not include fake duration, rating, or cost.

## 8. Sitemap

Update:

- `app/sitemap.ts`

Add static SEO entry:

- URL: `/seo/openclaw-wsl2-codex-tool-calls`
- `changeFrequency`: `monthly`
- `priority`: `0.6`
- `lastModified`: `new Date("2026-06-18")`

Keep existing dynamic skill/practice sitemap logic untouched.

## 9. Validation

Local validation:

- `npm run build`
- Confirm build output includes `/seo/openclaw-wsl2-codex-tool-calls`.
- If a local server is started, `curl -I http://localhost:<port>/seo/openclaw-wsl2-codex-tool-calls` should return `200`.

Content validation:

- H1 exists once.
- SSR HTML contains `OpenClaw WSL2`, `Codex tool calls`, and `Agent Skills directory`.
- The page includes at least five official outbound documentation links.
- The page includes internal links back into skill-cn.
- JSON-LD contains `Article` and `FAQPage`.

SEO validation:

- Unique title and description.
- Canonical path is correct.
- Robots index/follow.
- Sitemap includes the page.
- No broken internal links.

Engineering validation:

- TypeScript passes.
- No database access is required for the page.
- No client-side-only article rendering.
- No large assets or unnecessary client bundle.

## 10. Non-Goals

- Do not build a generic `/seo/[slug]` content engine.
- Do not create a CMS table.
- Do not scrape or import new practices.
- Do not change homepage title.
- Do not refactor global SEO utilities unless strictly required by the single page.
