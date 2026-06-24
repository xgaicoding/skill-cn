# P0 实践候选兜底记录（2026-06-24）

## 结论

截至 17:30 CST，本轮未发现可直接入库的高证据实践候选，线上 `practice_total=247` 维持不变。

本质判断：今天候选供给仍集中在官方介绍、awesome 目录、Skill 仓库、教程、提案、安全新闻或方法论材料。它们能证明生态活跃，但不能证明“某个用户在真实任务中使用 Skill，并留下输入、过程、输出和复盘”。按 `Skill x 场景 = 实践` 标准，本轮不新增 practice，避免污染实践池。

## 入库硬标准

- 真实任务：必须是在解决一个具体业务/创作/研发问题。
- Skill 绑定：必须能明确看到使用了某个 Skill / workflow / agent skill。
- 可见链路：需要公开的输入、关键步骤、配置、日志、截图、输出或成品。
- 可复核：原始链接可访问，能核验作者、时间、项目或结果。
- 非重复：不是已入库 `source_url`，也不是官方 intro / 目录页 / 泛教程。

## 候选拒绝表

| # | 候选 | 证据链接 | 来源 query / 来源池 | 拒绝原因 | 下一轮 query |
|---|---|---|---|---|---|
| 1 | DenisSergeevitch/agents-best-practices | https://github.com/DenisSergeevitch/agents-best-practices | `site:github.com agent skills best practices case study` | 方法论仓库，价值是跨 Codex / Claude Code 的 Agent 使用规范；缺具体业务任务、输入输出和结果验收。 | `site:github.com/DenisSergeevitch/agents-best-practices examples output case study` |
| 2 | OthmanAdi/planning-with-files | https://github.com/OthmanAdi/planning-with-files | 6/22 Watch pool | 3-file pattern 清晰，但 README 和 quickstart 仍是 Skill 说明；未看到第三方项目的 `.plans/` 文件、完成记录或 PR 结果。 | `"planning-with-files" "task_plan.md" "progress.md" "completed"` |
| 3 | affaan-m/ecc | https://github.com/affaan-m/ecc | `site:github.com "AGENTS.md" "SKILL.md" "Codex"` | Harness / 性能优化系统介绍，不是单个场景实践；缺 before/after、任务输入和可验证产出。 | `"affaan-m/ecc" "output" "before" "after" "Codex"` |
| 4 | prompt-security/clawsec | https://github.com/prompt-security/clawsec | `site:github.com "openclaw" "skill" "security"` | 安全 Skill suite 方向强相关，但当前证据主要是产品/风险说明；缺真实 audit output、整改日志和前后配置差异。 | `"ClawSec" "audit output" "OpenClaw"` |
| 5 | HuangYuChuh/ComfyUI_Skills_OpenClaw | https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw | 6/22 Watch pool | 能证明 ComfyUI workflow 可封装为 OpenClaw Skill；仍缺 prompt、workflow 输入、运行日志、生成图输出和复盘。 | `"ComfyUI_Skills_OpenClaw" "prompt" "generated image"` |
| 6 | box-community/openclaw-box-skill | https://github.com/box-community/openclaw-box-skill | `site:github.com "OpenClaw" "Skill" "README"` | Box CLI + Box AI 能力说明，未看到真实文件处理任务、输入文件、AI 输出和业务结果。 | `"openclaw-box-skill" "Box AI" "workflow" "example"` |
| 7 | win4r/OpenClaw-Skill | https://github.com/win4r/OpenClaw-Skill | `site:github.com "OpenClaw" "SKILL.md" "references"` | OpenClaw 知识/排障 Skill，偏 reference；不是某次排障、修复或部署复盘。 | `"win4r/OpenClaw-Skill" "debug" "fixed" "case"` |
| 8 | VoltAgent/awesome-openclaw-skills | https://github.com/VoltAgent/awesome-openclaw-skills | Source index | Awesome 目录，只能做上游来源；不满足实践单元。 | `site:github.com "openclaw" "skills/" "examples" "output"` |
| 9 | EvoLinkAI/awesome-openclaw-skills | https://github.com/EvoLinkAI/awesome-openclaw-skills | Source index | 目录型 OpenClaw skill 集合，缺单项任务结果。 | `site:github.com/EvoLinkAI/awesome-openclaw-skills "demo" "workflow"` |
| 10 | heilcheng/awesome-agent-skills | https://github.com/heilcheng/awesome-agent-skills | Source index | Agent Skills 资源集合，核心是发现 skill；不是实践案例。 | `site:github.com "agent-skill.co" "case study" "output"` |
| 11 | travisvn/awesome-claude-skills | https://github.com/travisvn/awesome-claude-skills | Source index | 资源集合和 best practices，缺具体任务和结果。 | `site:github.com/travisvn/awesome-claude-skills "examples" "case study"` |
| 12 | alirezarezvani/claude-skills | https://github.com/alirezarezvani/claude-skills | Source index | Claude Code skills / plugins 合集，目录属性强；缺单一实践场景和结果核验。 | `site:github.com/alirezarezvani/claude-skills "examples" "output" "demo"` |
| 13 | anthropics/skills | https://github.com/anthropics/skills | Standard source | 官方公共 Agent Skills 仓库，可做标准引用；不收官方样例作为第三方实践。 | `site:github.com "anthropics/skills" "I used" "project"` |
| 14 | anthropics/skills doc-coauthoring | https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md | Standard source | Workflow 清晰，但仍是官方 Skill 定义；缺外部用户协作产物。 | `"doc-coauthoring" "Claude skill" "draft" "case study"` |
| 15 | anthropics/claude-code skill-development | https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/skill-development/SKILL.md | Standard source | Skill 开发指导，适合提炼标准；不是实践案例。 | `"skill-development" "SKILL.md" "built" "repo"` |
| 16 | metaskills/skill-design-guide | https://github.com/metaskills/skill-design-guide | Source pool | Skill 设计指南，触发词和生命周期完整；缺真实业务场景产出。 | `"skill-design-guide" "created a skill" "case study"` |
| 17 | superpowers-developing-for-claude-code workflow example | https://github.com/obra/superpowers-developing-for-claude-code/blob/main/examples/full-featured-plugin/skills/workflow/SKILL.md | Source pool | Plugin/skill workflow 示例，偏演示模板；未发现用它交付具体项目的记录。 | `"superpowers" "workflow" "Claude Code" "project" "output"` |
| 18 | Cloudflare Code Mode | https://blog.cloudflare.com/code-mode/ | Official blog | 有 MCP 使用方式和效果描述，但属于官方产品博客；不是 Skill x 场景实践单元。 | `"Code Mode" "MCP" "case study" "agent" "workflow"` |
| 19 | Cloudflare enterprise MCP architecture | https://blog.cloudflare.com/enterprise-mcp/ | Official blog | 企业 MCP 安全架构文章，适合作为方法论；缺第三方落地实践。 | `"MCP Server Portals" "implemented" "case study"` |
| 20 | Cloudflare internal AI engineering stack | https://blog.cloudflare.com/internal-ai-engineering-stack/ | Official blog | 官方内部工程栈复盘，场景真实但不是 Agent Skill 复用包；不直接入 practice。 | `"internal AI engineering stack" "skills" "workflow"` |
| 21 | Cloudflare Email Service for agents | https://blog.cloudflare.com/email-for-agents/ | Official blog | 有 agent 发邮件场景，但属于官方 beta 发布；缺非官方 workflow 实例。 | `"Cloudflare Email Service" "agent" "send notification" "workflow"` |
| 22 | Cloudflare Agents SDK / Flue SDK | https://blog.cloudflare.com/agents-platform-flue-sdk/ | Official blog | 平台能力发布，包含 durable execution / filesystem / workflows；还不是用户实践。 | `"Flue SDK" "agent harness" "workflow" "demo"` |
| 23 | slowmist/openclaw-security-practice-guide | https://github.com/slowmist/openclaw-security-practice-guide | Watch pool | 安全实践指南主题强相关；未核验到具体 Skill 检查样例、报告或整改记录。 | `"openclaw-security-practice-guide" "audit report" "Skill" "example"` |
| 24 | openai/codex issue #5291 SKILL.md support | https://github.com/openai/codex/issues/5291 | Issue search | Feature request / workaround 讨论，说明需求但不是实践收录对象。 | `"Codex" "SKILL.md" "AGENTS.md" "works" "project"` |
| 25 | anthropics/claude-code issue #50778 AGENTS.md + skills support | https://github.com/anthropics/claude-code/issues/50778 | Issue search | Issue 提案，描述多 agent workflow 痛点；缺落地结果。 | `"AGENTS.md" ".agents/skills" "multi-agent workflow" "repo"` |
| 26 | mgechev/skills-best-practices | https://github.com/mgechev/skills-best-practices | 6/15 rejected pool | Best practices / guide，讲如何写高质量 skills；缺具体业务场景、输入数据和真实产出。 | `"skills-best-practices" "used" "case study" "output"` |
| 27 | Agent Skills 傻瓜式教程 | https://juejin.cn/post/7599604510366236710 | `site:juejin.cn "Agent Skills" "实战"` | 入门教程，主要讲安装和使用 Skills；结果证据弱，且不是近新供给。 | `site:juejin.cn "Agent Skills" "项目复盘" "输出"` |
| 28 | Agent Skills 技术详解与实战 | https://juejin.cn/post/7624374842523566107 | `site:juejin.cn "Agent Skills" "实战"` | 标题含“实战”，正文定位偏机制介绍；缺真实项目结果。 | `site:juejin.cn "Agent Skills" "真实项目" "截图"` |
| 29 | openclaw/openclaw | https://github.com/openclaw/openclaw | Official repo | OpenClaw 官方项目 README，是框架本体说明，不是外部实践案例。 | `"OpenClaw" "Skill" "case study" "output" -awesome` |
| 30 | VoltAgent/awesome-agent-skills | https://github.com/VoltAgent/awesome-agent-skills | Source index | Curated marketplace / 目录，缺单个业务场景的使用结果。 | `site:github.com "agent skills" "before after" "output"` |
| 31 | Agent Skills 实战分享：AI 编程最后一公里 | https://juejin.cn/post/7600227607977852980 | `site:juejin.cn "Agent Skills" "实战分享"` | 有实践味道但偏官方经验分享，发布时间较早；缺可复核的具体项目交付链路。 | `"AI 编程最后一公里" "Skill" "项目" "输出"` |
| 32 | GitHub Community discussion: Custom Agents / Agent Skills | https://github.com/orgs/community/discussions/183962 | Discussion search | 讨论帖，内容是 custom agents、skills、MCP 边界解释；不是实践案例。 | `site:github.com/orgs/community/discussions "Agent Skills" "built" "output"` |
| 33 | ComposioHQ/awesome-claude-skills | https://github.com/ComposioHQ/awesome-claude-skills | Source index | Awesome 列表和安装说明；可做外链渠道，本身不是实践。 | `site:github.com/ComposioHQ/awesome-claude-skills "case study" "output"` |
| 34 | Agent Skills 工作流：从入门到实战 | https://juejin.cn/post/7600994087588053011 | `site:juejin.cn "Agent Skills" "工作流" "实战"` | 旧工作流教程，偏架构说明；没有明确可复核的真实项目结果。 | `site:juejin.cn "Claude Code Skill" "工作流" "复盘"` |
| 35 | wshobson/agents docs/agent-skills.md | https://github.com/wshobson/agents/blob/main/docs/agent-skills.md | `site:github.com "agent-skills.md" "Claude" "SKILL.md"` | 文档页，讲 Agent Skills specification 和插件生态；缺业务场景、执行步骤和结果。 | `"wshobson/agents" "agent skills" "case study"` |
| 36 | React Router Agent Skill discussion | https://github.com/remix-run/react-router/discussions/14750 | `site:github.com "Official React Router Agent Skill" "Agent Skills"` | 提案讨论，目标是建议官方维护 React Router agent skill；尚不是已落地实践。 | `"React Router Agent Skill" "used" "project" "output"` |

## 下一轮精准 query

```text
site:github.com "SKILL.md" "case study" "output" "before" "after"
site:github.com "OpenClaw" "Skill" "run log" "output"
site:github.com "Claude Code" "Skill" "PR" "completed"
site:github.com "planning-with-files" "progress.md" "completed"
site:github.com "ComfyUI_Skills_OpenClaw" "prompt" "generated image"
site:github.com "ClawSec" "audit output" "remediation"
site:juejin.cn "Claude Code Skill" "真实项目" "输出"
site:zhihu.com "Agent Skills" "项目复盘" "截图"
site:bilibili.com "OpenClaw Skill" "实战" "输出"
"SKILL.md" "used it to" "deployed" "screenshot"
```

## 后续动作

1. 对 awesome / official / docs 入口只做二级跳转，不再作为实践候选直接评审。
2. `ComfyUI_Skills_OpenClaw` 只追 `prompt -> workflow -> run log/history -> generated image` 证据链。
3. `clawsec` 只追 `audit command -> report/output -> remediation` 证据链。
4. `planning-with-files` 只追 `task_plan.md/findings.md/progress.md -> completed task -> PR/deploy/result` 证据链。
5. 若下一轮仍无合格新增，应把搜索面转向中文平台真实项目复盘，而不是继续扩大 GitHub 目录池。
