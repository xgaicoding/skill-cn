# 2026-06-22 P0 实践证据管道

## 结论

截至 14:24 CST，本轮未新增实践，线上 `practice_total=247`。已落盘 25 个候选，全部按 `Skill x 场景 = 实践` 标准标记证据链接、拒绝原因和下一步 query。

本质问题不是没有 Agent Skill / OpenClaw / Codex Skill 相关内容，而是公开材料多数仍处在目录、官方说明、规范、教程或提案阶段，缺少真实任务、可见输出和复盘证据。今天下午继续从“单项 repo 的 examples / output / demo / case study”方向转化，不再空扫 awesome/official 入口。

## 硬标准

- 必须是用 Skill 完成具体任务，不是介绍 Skill。
- 必须有公开证据链：原文、仓库、示例、截图、日志、产物或指标。
- 必须可复用：能看到步骤、输入、关键配置或工作流。
- 必须有结果：输出样例、成品、部署地址、前后对比或复盘。
- 避免重复：若只是目录、规范、官方 intro、Issue 提案，进入 source pool，不入 practice。

## 候选证据表

| # | 候选 | 证据链接 | 当前判断 | 拒绝原因 / blocker | 下一步 query |
|---|---|---|---|---|---|
| 1 | DenisSergeevitch/agents-best-practices | https://github.com/DenisSergeevitch/agents-best-practices | Source pool | 跨 Codex / Claude Code 的 Skill 最佳实践仓库，价值是方法论；未看到某个真实项目任务、输入输出和验收结果。 | `site:github.com/DenisSergeevitch/agents-best-practices examples output case study` |
| 2 | OthmanAdi/planning-with-files | https://github.com/othmanadi/planning-with-files | Source pool | 文件化 planning skill，场景接近长任务状态管理，但 README 更像工具/skill 说明，缺少第三方项目复盘或可验证产物。 | `"planning-with-files" "case study" OR "used in" OR "demo"` |
| 3 | affaan-m/ecc | https://github.com/affaan-m/ecc | Watch | 最近更新，涉及 AGENTS.md、SKILL.md、Codex hooks 替代方案；目前是 harness/性能优化系统介绍，不是单个场景实践。 | `"affaan-m/ecc" "output" "before" "after" "Codex"` |
| 4 | prompt-security/clawsec | https://github.com/prompt-security/clawsec | Watch | 近期安全 skill suite，有 release / scanner / advisory 等子 skill；当前证据是套件结构，不是一次安全 hardening 复盘。 | `"clawsec" "scan result" "OpenClaw" "report"` |
| 5 | HuangYuChuh/ComfyUI_Skills_OpenClaw | https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw | Watch | ComfyUI workflow 转 agent skill，场景明确；但需进一步核验是否有生成图、workflow 输入、输出和可复现步骤。 | `"ComfyUI_Skills_OpenClaw" "workflow" "output" "image"` |
| 6 | box-community/openclaw-box-skill | https://github.com/box-community/openclaw-box-skill | Source pool | Box CLI + Box AI 集成 skill，只有能力说明和文档链接，缺真实文件处理任务、输入文件、AI 输出。 | `"openclaw-box-skill" "Box AI" "workflow" "example"` |
| 7 | win4r/OpenClaw-Skill | https://github.com/win4r/OpenClaw-Skill | Source pool | OpenClaw 知识/排障 skill，包含 architecture、gateway、pairing references；不是业务任务复盘。 | `"win4r/OpenClaw-Skill" "debug" "fixed" "case"` |
| 8 | VoltAgent/awesome-openclaw-skills | https://github.com/VoltAgent/awesome-openclaw-skills | Source index | Awesome 目录，适合做上游来源，不满足实践单元。 | `site:github.com "openclaw" "skills/" "examples" "output"` |
| 9 | EvoLinkAI/awesome-openclaw-skills | https://github.com/EvoLinkAI/awesome-openclaw-skills | Source index | 目录型 OpenClaw skill 集合，缺单项任务结果。 | `site:github.com/EvoLinkAI/awesome-openclaw-skills "demo" "workflow"` |
| 10 | heilcheng/awesome-agent-skills | https://github.com/heilcheng/awesome-agent-skills | Source index | Agent Skills 目录和 quick start，核心是发现 skill，不是实践案例。 | `site:github.com "agent-skill.co" "case study" "output"` |
| 11 | travisvn/awesome-claude-skills | https://github.com/travisvn/awesome-claude-skills | Source index | 资源集合和 best practices，缺具体任务与结果。 | `site:github.com/travisvn/awesome-claude-skills "examples" "case study"` |
| 12 | alirezarezvani/claude-skills | https://github.com/alirezarezvani/claude-skills | Source index | 大型 skill/plugin 合集，适合拆分子 skill；仓库本身不是实践。 | `site:github.com/alirezarezvani/claude-skills "examples" "output" "demo"` |
| 13 | anthropics/skills | https://github.com/anthropics/skills | Standard source | 官方公共 Agent Skills 仓库，可做标准引用；不收官方样例作为第三方实践。 | `site:github.com "anthropics/skills" "I used" "project"` |
| 14 | anthropics/skills doc-coauthoring | https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md | Standard source | Doc coauthoring workflow 清晰，但仍是官方 skill 定义，不是外部用户真实协作产物。 | `"doc-coauthoring" "Claude skill" "draft" "case study"` |
| 15 | anthropics/claude-code skill-development | https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/skill-development/SKILL.md | Standard source | Skill 开发指导，适合提炼标准；不是实践案例。 | `"skill-development" "SKILL.md" "built" "repo"` |
| 16 | metaskills/skill-design-guide | https://github.com/metaskills/skill-design-guide | Source pool | Skill 设计指南，触发词和生命周期完整；缺真实业务场景产出。 | `"skill-design-guide" "created a skill" "case study"` |
| 17 | superpowers-developing-for-claude-code workflow example | https://github.com/obra/superpowers-developing-for-claude-code/blob/main/examples/full-featured-plugin/skills/workflow/SKILL.md | Source pool | Plugin/skill workflow 示例，偏演示模板；需要找到作者或用户用它完成具体任务的记录。 | `"superpowers" "workflow" "Claude Code" "project" "output"` |
| 18 | Cloudflare Code Mode | https://blog.cloudflare.com/code-mode/ | Source pool | 有 MCP 使用方式和效果描述，但属于官方产品博客；不是 skill-cn 的 Skill x 场景实践单元。 | `"Code Mode" "MCP" "case study" "agent" "workflow"` |
| 19 | Cloudflare enterprise MCP architecture | https://blog.cloudflare.com/enterprise-mcp/ | Source pool | 企业 MCP 安全架构文章，适合作为方法论和证据引用；缺第三方落地实践。 | `"MCP Server Portals" "implemented" "case study"` |
| 20 | Cloudflare internal AI engineering stack | https://blog.cloudflare.com/internal-ai-engineering-stack/ | Source pool | 官方内部工程栈复盘，场景真实但不是 Agent Skill 复用包；可转为 SEO/文章素材，不直接入 practice。 | `"internal AI engineering stack" "skills" "workflow"` |
| 21 | Cloudflare Email Service for agents | https://blog.cloudflare.com/email-for-agents/ | Source pool | 有“agent 发邮件”场景，但属于官方 beta 发布；需要找到非官方 agent workflow 实例。 | `"Cloudflare Email Service" "agent" "send notification" "workflow"` |
| 22 | Cloudflare Agents SDK / Flue SDK | https://blog.cloudflare.com/agents-platform-flue-sdk/ | Source pool | 平台能力发布，包含 durable execution / filesystem / workflows；还不是用户实践。 | `"Flue SDK" "agent harness" "workflow" "demo"` |
| 23 | slowmist/openclaw-security-practice-guide | https://github.com/slowmist/openclaw-security-practice-guide | Watch | 安全实践指南，主题强相关；需要核验是否有具体 skill 检查样例、报告或整改记录。 | `"openclaw-security-practice-guide" "audit report" "Skill" "example"` |
| 24 | GitHub openai/codex #5291 SKILL.md support | https://github.com/openai/codex/issues/5291 | Reject | Issue / feature request，说明需求和 workaround，不是实践收录对象。 | `"Codex" "SKILL.md" "AGENTS.md" "works" "project"` |
| 25 | GitHub anthropics/claude-code #50778 AGENTS.md + skills support | https://github.com/anthropics/claude-code/issues/50778 | Reject | Issue 提案，描述多 agent workflow 痛点；缺落地结果。 | `"AGENTS.md" ".agents/skills" "multi-agent workflow" "repo"` |

## 下一步执行队列

1. 优先深挖 `ComfyUI_Skills_OpenClaw`：如果能找到具体 workflow 输入、生成图输出和 CLI 使用步骤，可转 practice。
2. 深挖 `clawsec`：如果能找到扫描报告或 OpenClaw skill 安全检查日志，可转安全实践候选。
3. 深挖 `planning-with-files`：寻找第三方长任务 / 多 agent 项目复盘，重点证据是 `.plans/` 或 markdown 状态文件如何降低上下文丢失。
4. 对 awesome 目录只做二级跳转，不再把目录本身当候选；query 必须带 `demo/output/case study/before after/screenshot/log`。
5. 若 16:00 前仍无合格新增，继续扩大到中文平台：掘金、知乎、B 站，关键词限定 `Claude Code Skill 真实项目`、`OpenClaw Skill 工作流 复盘`、`SKILL.md 项目实战 输出`。

## 14:50 复核更新

结论：前三个 Watch 候选暂不转 practice。三者均有继续跟踪价值，但还没有达到公开入库的实践证据强度。

| 候选 | 新增证据 | 复核结论 | 下一步 |
|---|---|---|---|
| `ComfyUI_Skills_OpenClaw` | GitHub README 明确 workflow 需要 ComfyUI API format、`Save Image` output node、`schema.json` 参数映射，并提供 CLI-first changelog；SkillsLLM / MCP App Store 也确认它是可用于导入、执行、取回输出的 ComfyUI workflow skill。 | 仍不入库。证据能证明 skill 能力和安全扫描，不能证明某个用户用它完成了具体图像生成任务；缺 prompt、workflow 输入、生成图输出、运行日志或复盘。 | 继续搜 `"ComfyUI_Skills_OpenClaw" "generated" "prompt" "history"`、`"comfyui-skill history list" "output"`、`"HuangYuChuh" "ComfyUI" "generated image"`。 |
| `clawsec` | OpenClaw clawhub issue #1824 记录了命名冲突、MITM/本地 CA 等高风险行为，且 scan/moderation 状态含 suspicious。 | 降级为安全风险观察项，不入 practice。当前最强证据是供应链/命名保护问题，不是一次安全扫描或整改实践。 | 继续搜 Prompt Security 官方 ClawSec suite 的真实扫描报告：`"Prompt Security" "ClawSec" "scan report" "agent"`、`"clawsec" "security report" "OpenClaw"`。 |
| `planning-with-files` | OpenReview survey 把 Planning-with-Files 归类为 long-horizon context 技术，说明 task state、spec、intermediate results 写入文件系统以绕过上下文窗口限制。 | 仍不入库。证据是论文/综述级引用，只证明模式存在；缺第三方项目的 `.plans/` 文件、前后对比、完成结果或复盘。 | 继续搜 `"planning-with-files" ".plans" "completed"`、`"planning-with-files" "task_plan.md" "progress.md"`、`"OthmanAdi/planning-with-files" "used" "project"`。 |

## 本轮检索入口

```text
site:github.com "AGENTS.md" "Codex" "workflow" "Claude Code" "SKILL.md"
site:github.com "SKILL.md" "Claude Code" "examples" "workflow"
site:github.com "OpenClaw" "Skill" "workflow" "README"
site:blog.cloudflare.com agents mcp code mode skills workflow
site:github.com "openclaw" "skill" "security" "report"
site:github.com "ComfyUI" "OpenClaw" "workflow" "output"
```
