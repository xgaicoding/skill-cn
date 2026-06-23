# OpenClaw WSL2 / Codex Tool Calls Post-launch Check

> Version: 1.6.0  
> Date: 2026-06-23  
> Owner: 张一鸣  
> Route: `/seo/openclaw-wsl2-codex-tool-calls`  
> Status: Passed with no blocking SEO gaps

## 1. Scope

This check verifies the post-launch SEO acceptance criteria for the OpenClaw WSL2 / Codex tool calls landing page:

- title and meta description
- canonical URL
- index/follow robots signal
- Article / FAQPage JSON-LD
- sitemap discovery
- internal links
- live `200` response
- local production build

## 2. Live Response

Checked on `2026-06-23 11:13 CST`.

Command:

```bash
curl -sS -D /tmp/seo-page.headers -o /tmp/seo-page.html \
  https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls
```

Result:

- HTTP status: `200`
- `content-type`: `text/html; charset=utf-8`
- `x-matched-path`: `/seo/openclaw-wsl2-codex-tool-calls`
- `x-vercel-cache`: `PRERENDER`
- `content-length`: `83194`

Conclusion: live page is available and pre-rendered.

## 3. Title / Meta / Canonical

Evidence found in live HTML:

- `<title>`: `OpenClaw WSL2 与 Codex Tool Calls 排查指南 | skill-cn | Skill Hub 中国`
- Meta description: `面向 Windows/WSL2 开发者的 OpenClaw + Codex tool calls 实战排查指南：理解 Codex harness、AGENTS.md、Agent Skills、MCP/plugin 工具暴露与常见故障。`
- Keywords include: `OpenClaw WSL2`, `Codex tool calls`, `Agent Skills directory`, `Codex WSL2 Windows`, `OpenClaw Codex harness`, `AGENTS.md Codex`
- Canonical: `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls`
- Robots meta: `index, follow`
- OG URL: `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls`
- OG type: `article`
- Twitter card: `summary_large_image`

Conclusion: core metadata is present and unique for the route.

## 4. Structured Data

Evidence found in SSR/live HTML:

- Site-wide `Organization` JSON-LD
- Site-wide `WebSite` JSON-LD
- Page-level `Article` JSON-LD
- Page-level `FAQPage` JSON-LD
- Page-level `HowTo` JSON-LD

Page-level `Article` fields verified:

- `@type`: `Article`
- `headline`: `OpenClaw WSL2 与 Codex Tool Calls 排查指南`
- `description`: matches the page meta description
- `author.name`: `Skill Hub 中国`
- `publisher.name`: `Skill Hub 中国`
- `datePublished`: `2026-06-18`
- `dateModified`: `2026-06-18`
- `mainEntityOfPage`: `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls`

FAQ content verified:

- Six visible FAQ questions are present in the page body.
- `FAQPage` JSON-LD is emitted from the same `faqItems` source array as the visible FAQ.

Conclusion: required `Article` and `FAQPage` JSON-LD are present. Optional `HowTo` JSON-LD is also present.

## 5. Sitemap / Robots

Commands:

```bash
curl -sS -D /tmp/sitemap.headers -o /tmp/sitemap.xml https://www.skill-cn.com/sitemap.xml
curl -sS -D /tmp/robots.headers -o /tmp/robots.txt https://www.skill-cn.com/robots.txt
rg -c 'https://www\.skill-cn\.com/seo/openclaw-wsl2-codex-tool-calls' /tmp/sitemap.xml
rg -n 'Sitemap|Disallow|Allow' /tmp/robots.txt
```

Results:

- Sitemap includes target URL: `1`
- `robots.txt` allows `/`
- `robots.txt` disallows `/api/` and `/auth/`
- `robots.txt` declares `Sitemap: https://www.skill-cn.com/sitemap.xml`

Conclusion: URL is discoverable through sitemap and not blocked by robots rules.

## 6. Internal Links

Internal links verified in SSR/live HTML:

- Hero CTA: `href="#checklist"`
- Homepage / directory CTA: `href="/"` with anchor text `看 Agent Skills directory`
- Next-practice CTA: `href="/"` with anchor text `浏览 AI 编程 Agent 技能目录`

Implementation note:

- The brief allowed linking to `/` when reliable concrete OpenClaw/Codex practice IDs were not available.
- No broken TODO internal links were published.

Conclusion: internal navigation exists, but the page still has an SEO opportunity to link into more specific OpenClaw/Codex practice pages once those assets exist.

## 7. Content Acceptance

Verified in live HTML:

- Target keywords present: `OpenClaw WSL2`, `Codex tool calls`, `Agent Skills directory`
- Native Windows vs WSL2 guidance is present and does not claim WSL2 is always better.
- Tool-call mental model is present.
- Troubleshooting checklist is present.
- Minimal reproducible flow is present.
- FAQ section is present.
- Official outbound references are present:
  - OpenAI Codex CLI
  - OpenAI Codex Windows
  - OpenAI AGENTS.md guide
  - OpenAI Agent Skills
  - OpenClaw Codex harness
  - OpenClaw tools overview
  - AGENTS.md

Conclusion: content acceptance criteria are met.

## 8. Build Validation

Command:

```bash
npm run build
```

Result:

- Status: passed on `2026-06-23`
- Build output includes `/seo/openclaw-wsl2-codex-tool-calls`
- Non-blocking warnings:
  - Next.js reported `Found lockfile missing swc dependencies` and failed to auto-patch the lockfile, but the build still exited with code `0`.
  - Next.js reported existing `metadata.themeColor` migration warnings on several routes, including this SEO route.

Conclusion: route builds under the current Next.js production build.

## 9. SEO Gaps

Blocking gaps: none found.

Non-blocking opportunities:

- Add concrete internal links to future OpenClaw/Codex-specific practice detail pages when reliable page IDs exist.
- Submit or re-submit the URL in Google Search Console after the deployment containing this check document is live.
- Review GSC query impressions after `7 / 14 / 28` days for `OpenClaw WSL2`, `Codex tool calls`, and `Agent Skills directory`.

## 10. Verdict

The launched route satisfies the P0 post-launch SEO checklist:

- title/meta: pass
- canonical: pass
- index/follow: pass
- Article JSON-LD: pass
- FAQPage JSON-LD: pass
- sitemap discovery: pass
- internal links: pass with non-blocking specificity opportunity
- live `200`: pass
- production build: pass
