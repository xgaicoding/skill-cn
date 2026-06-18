# OpenClaw WSL2 / Tool Calls SEO Brief

> Version: 1.6.0  
> Date: 2026-06-12  
> Owner: 张一鸣  
> Status: Ready for implementation

## 1. Objective

Build one SEO landing page that captures developers searching for how to run OpenClaw/Codex-style agents on Windows WSL2 and how to understand/fix tool-call behavior in Codex harness sessions.

The page should not be a generic "AI agent" article. It should be a practical troubleshooting and setup guide that links skill-cn's existing Agent Skills/practice content with a concrete Windows + WSL2 + OpenClaw/Codex workflow.

Primary outcome:

- Publish an indexable page for the topic cluster: `OpenClaw WSL2`, `Codex tool calls`, `Agent Skills directory`.
- Give developers a path from "my agent/tool calls do not work" to "use repeatable skills and practices on skill-cn".
- Create a reusable SEO template for future platform-specific troubleshooting pages.

## 2. Target Audience

- Chinese developers using Windows 11 + WSL2 for AI coding agents.
- Developers evaluating OpenClaw, Codex CLI, Codex harness, or Agent Skills.
- Users who already know Claude Code/Cursor/Codex but are confused by tool permissions, tool-call routing, MCP/plugin exposure, or AGENTS.md/SKILL.md behavior.

Search intent is mainly "problem solving", not "brand discovery".

## 3. Keyword Set

| Priority | Keyword | Intent | Page Treatment |
| --- | --- | --- | --- |
| P0 | OpenClaw WSL2 | Setup/troubleshooting | H1/H2, intro, WSL2 setup checklist |
| P0 | Codex tool calls | Troubleshooting/explanation | H2, tool-call flow diagram, FAQ |
| P0 | Agent Skills directory | Discovery/comparison | Internal links to skill/practice pages |
| P1 | Codex WSL2 Windows | Setup | FAQ and comparison table |
| P1 | OpenClaw Codex harness | Architecture | Explanation section with official docs evidence |
| P1 | AGENTS.md Codex | Instruction management | FAQ and internal links |
| P2 | Codex MCP tools not showing | Debugging | Troubleshooting checklist |
| P2 | AI coding agent WSL2 | Broad discovery | Supporting copy only |

Recommended URL:

`/seo/openclaw-wsl2-codex-tool-calls`

Recommended title:

`OpenClaw WSL2 与 Codex Tool Calls 排查指南 | skill-cn`

Recommended meta description:

`面向 Windows/WSL2 开发者的 OpenClaw + Codex tool calls 实战排查指南：理解 Codex harness、AGENTS.md、Agent Skills、MCP/plugin 工具暴露与常见故障。`

## 4. Evidence Sources

Use these as cited outbound references in the page. Prefer official docs as first-class evidence.

| Source | URL | Evidence To Use |
| --- | --- | --- |
| OpenAI Codex CLI | https://developers.openai.com/codex/cli | Codex CLI supports macOS, Windows, Linux; Windows can run natively or via WSL2 for Linux-native workflows. |
| OpenAI Codex Windows | https://developers.openai.com/codex/windows | Native Windows sandbox is default; WSL2 is appropriate when the workflow already lives in WSL2 or needs Linux-native behavior. |
| OpenAI AGENTS.md guide | https://developers.openai.com/codex/guides/agents-md | Codex reads AGENTS.md before work and supports layered project instructions. |
| OpenAI Agent Skills | https://developers.openai.com/codex/skills | Agent Skills package instructions, resources, and scripts to extend Codex with task-specific workflows. |
| OpenClaw Codex harness | https://docs.openclaw.ai/plugins/codex-harness | Codex harness lets Codex own low-level sessions while OpenClaw owns chat channels, approvals, dynamic tools, and transcript mirror. |
| OpenClaw tools overview | https://docs.openclaw.ai/tools | Codex harness runs use Codex-native code mode, native tool search, deferred dynamic tools, and nested tool calls. |
| AGENTS.md | https://agents.md/ | AGENTS.md is a predictable instruction format for coding agents, used by many open-source projects. |

Local product evidence:

- skill-cn already positions itself as an AI practice distribution site, not a generic tool directory.
- Existing memory says Codex ACP sessions may fail to expose external MCP/plugin tools, so this page should distinguish "Codex harness", "OpenClaw dynamic tools", "MCP/plugin tools", and "Agent Skills".
- Existing SEO strategy favors long-tail problem pages with structured summaries, FAQ, HowTo/Article schema, and internal links to related skill/practice pages.

## 5. SERP / Competitor Structure

Observed SERP pattern from 2026-06-12 search:

| Query Cluster | Ranking Content Pattern | Gap |
| --- | --- | --- |
| `Codex Windows WSL2` | Official OpenAI docs, short setup docs, community posts, YouTube tutorials | Strong setup info, weak Chinese troubleshooting depth |
| `Codex tool calls` | Official docs, OpenClaw docs, scattered issue/forum posts | Tool-call routing is fragmented across docs; no consolidated Chinese debugging page |
| `OpenClaw Codex harness` | OpenClaw docs and GitHub issues | Official docs explain architecture, but not "what to do when tools do not show" |
| `AGENTS.md Codex` | OpenAI docs, agents.md, blog posts | Good conceptual docs, weak mapping to reusable skill/practice discovery |
| `Agent Skills directory` | OpenAI docs, GitHub repos, skills directories | Directories list skills, but rarely explain scenario-based practice selection |

Content opportunity:

Create a Chinese "setup + mental model + troubleshooting + next practice" page. It should combine what competitors split across docs, issues, and tutorials.

## 6. Page Outline

### H1

OpenClaw WSL2 与 Codex Tool Calls 排查指南

### Above The Fold

- One-paragraph answer: when to use WSL2, what tool calls are, why OpenClaw/Codex tool exposure can look different.
- Quick decision table:
  - Native Windows: best default for Codex on Windows.
  - WSL2: best when repo, shell, dependencies, or Linux sandbox assumptions already live in WSL2.
  - OpenClaw Codex harness: best when Codex should own the low-level coding session while OpenClaw owns messaging/session orchestration.

### Section 1: 先建立正确模型

Explain the four layers:

1. Windows / WSL2 runtime
2. Codex CLI or Codex harness
3. OpenClaw session, dynamic tools, approvals, message routing
4. AGENTS.md and Agent Skills as reusable instruction/workflow layer

Include a simple text diagram:

`User -> OpenClaw chat/session -> Codex harness -> Codex tool calls -> local shell/files/MCP/plugin surfaces`

### Section 2: WSL2 什么时候值得用

Cover:

- Repo and package manager already live in WSL2.
- Linux-native toolchain is required.
- Native Windows sandbox or tool behavior does not match the project.
- Need consistency with CI/Linux production environment.

Avoid claiming WSL2 is always better. Official Codex Windows docs recommend native Windows by default, with WSL2 for Linux-native workflows.

### Section 3: Codex Tool Calls 为什么会“看起来不工作”

Troubleshooting checklist:

- Is the current session Codex harness or another agent runtime?
- Are the tools actually exposed to this turn?
- Is the tool a Codex-native tool, OpenClaw dynamic tool, MCP/plugin tool, or Agent Skill workflow?
- Is approval/sandbox policy blocking the action?
- Is the project inside WSL2 while the UI/app config points to Windows paths?
- Did AGENTS.md or skill instructions constrain the allowed action?
- Did the command fail because of system resources, missing env vars, or absent credentials rather than tool routing?

### Section 4: AGENTS.md 与 Agent Skills 怎么配合

Explain:

- AGENTS.md: project/team instructions, loaded before work.
- Agent Skill: reusable workflow package for a task category.
- skill-cn content model: "Skill x scenario = practice", so the page should point users to real practice pages after setup.

### Section 5: 最小可复现排查流程

Steps:

1. Confirm environment: Windows native or WSL2.
2. Confirm working directory and repo path.
3. Confirm agent runtime: Codex CLI, Codex app, or OpenClaw Codex harness.
4. Run a harmless file-read/list command.
5. Run a harmless file-write in a temp path.
6. Check whether dynamic tools/MCP/plugin tools are listed in the current session.
7. Check AGENTS.md and skill constraints.
8. Record exact error: missing tool, permission denial, command failure, timeout, or resource exhaustion.

### Section 6: 推荐下一步实践

Link to internal skill-cn assets:

- Agent Skills / Skill discovery pages.
- Codex-related practice pages.
- OpenClaw 101 / OpenClaw skill pages.
- Practice pages about WeChat automation, summarization, browser automation, or other real Agent Skill examples.

If a target internal page does not exist yet, create TODO links in implementation notes rather than publishing broken links.

### FAQ

Suggested questions:

1. Codex 在 Windows 上应该用原生还是 WSL2？
2. OpenClaw Codex harness 和直接运行 Codex CLI 有什么区别？
3. 为什么 Codex 看不到 MCP/plugin tools？
4. AGENTS.md 和 SKILL.md 谁的优先级更高？
5. Agent Skills directory 和普通工具目录有什么区别？
6. Tool call 失败时应该先查权限、路径还是工具暴露？

## 7. Internal Linking Plan

Required internal links:

| Anchor | Target |
| --- | --- |
| Agent Skills 实践案例 | `/practice` filtered or relevant practice detail pages |
| OpenClaw 101 | Existing OpenClaw category/tag/skill page if available |
| Codex / coding agent 工作流 | Relevant skill/practice pages |
| AI 编程 Agent 技能目录 | Skill listing or Agent Skills directory landing page |
| AGENTS.md 团队工作流 | Existing or future practice page about AGENTS.md/SKILL.md |

Implementation note:

- If current routes do not support filtered `/practice` URLs, link to concrete practice detail pages or `/practice` hub.
- Avoid linking only to outbound docs. The page's SEO value depends on routing users into skill-cn's own practice graph.

## 8. Structured Data

Use:

- `Article` schema for the main page.
- `FAQPage` schema for FAQ.
- Optional `HowTo` schema for the minimal reproducible troubleshooting flow.

Do not add fake ratings or fake author credentials.

Recommended article fields:

- `headline`: OpenClaw WSL2 与 Codex Tool Calls 排查指南
- `description`: same as meta description
- `author`: skill-cn
- `datePublished`: actual publish date
- `dateModified`: actual modified date

## 9. Acceptance Criteria

Content:

- Contains at least 3 target keywords: `OpenClaw WSL2`, `Codex tool calls`, `Agent Skills directory`.
- Cites at least 2 official sources; target is 5+ sources listed above.
- Includes setup guidance, tool-call mental model, troubleshooting checklist, FAQ, and internal links.
- Explains native Windows vs WSL2 without overstating either path.
- Clearly distinguishes AGENTS.md, Agent Skills, OpenClaw dynamic tools, MCP/plugin tools, and Codex-native tool calls.

SEO:

- Page has unique title, meta description, canonical URL, OG/Twitter metadata.
- Page is present in sitemap.
- Page is indexable and not blocked by robots.
- Includes Article + FAQPage JSON-LD; HowTo JSON-LD if implementation cost is low.
- Internal links point to existing skill-cn pages; no broken internal links.

Engineering:

- Route builds under Next.js 14.
- `npm run build` passes.
- No client-only content for the main article body; crawlers can see the full text in SSR HTML.
- Page loads in under current site baseline; avoid large client bundles.

Post-launch measurement:

- Submit URL to GSC after deploy.
- Track impressions for target queries after 7/14/28 days.
- Track internal click-through from this page to practice/skill pages.

## 10. Implementation Notes

Recommended implementation shape:

- Add a static/MDX-style content page if the project already has a content mechanism.
- If no MDX pipeline exists, implement as a server-rendered route with structured content arrays.
- Keep the page as a practical guide, not a marketing landing page.
- Use skill-cn's existing visual system; avoid introducing a new design language for a single SEO page.

Potential route file:

`app/seo/openclaw-wsl2-codex-tool-calls/page.tsx`

Potential metadata helper:

`generateMetadata()` in the route page.

Potential source/citation block:

Render official references near the end as "参考资料", with outbound links marked clearly.

