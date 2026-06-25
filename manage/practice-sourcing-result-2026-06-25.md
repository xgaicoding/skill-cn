# P1 Practice Sourcing Result - 2026-06-25

## Conclusion

截至 17:30 CST，本轮未发现可直接入库的合格 practice，`practice_total=247` 维持不变，未达到 `practice_total 248`。

执行质量闸：不把官方 intro、目录页、教程、提案或方法论材料强行包装成实践。今天按复盘型候选继续二次筛选，所有候选都缺少 `input -> process -> output -> result` 的完整公开证据链，因此落盘兜底记录。

## Practice 入库硬标准

- 真实任务：必须能看到用户在解决具体业务、研发、创作或运维问题。
- Skill 绑定：必须能明确关联到某个 Agent Skill、OpenClaw Skill、Claude/Codex Skill 或可复用 workflow。
- 可见链路：必须有输入、关键步骤、运行日志、截图、输出文件、PR、部署结果或复盘结论。
- 可复核：原始链接可访问，能核验作者、时间、项目和结果。
- 非目录化：awesome、官方 README、标准文档、教程和 proposal 只作为上游线索，不直接入库。

## 20 条复盘型候选复核表

| # | 候选 | 证据链接 | 来源方向 | 当前判断 | 拒绝原因 | 下一步最小证据缺口 |
|---|---|---|---|---|---|---|
| 1 | OthmanAdi/planning-with-files | https://github.com/OthmanAdi/planning-with-files | planning-with-files completed task | 继续观察 | README 说明 3-file pattern，但没有第三方真实任务完成记录。 | 找到包含 `task_plan.md`、`progress.md`、最终 PR/部署结果的项目复盘。 |
| 2 | prompt-security/clawsec | https://github.com/prompt-security/clawsec | clawsec audit output | 继续观察 | 能证明安全 Skill suite 存在，未看到一次真实 audit command、报告输出和 remediation。 | 找到 `clawsec scan` 命令、扫描报告、整改 diff 或复测记录。 |
| 3 | HuangYuChuh/ComfyUI_Skills_OpenClaw | https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw | ComfyUI generated output | 继续观察 | 能证明 ComfyUI workflow 可转 OpenClaw Skill，但缺 prompt、workflow 输入、生成图和复盘。 | 找到 prompt、workflow JSON、运行日志和最终 generated image。 |
| 4 | box-community/openclaw-box-skill | https://github.com/box-community/openclaw-box-skill | OpenClaw file workflow | 拒绝入库 | 仓库是 Box CLI / Box AI 能力说明，未看到具体文件处理任务和结果。 | 找到真实文档输入、Box AI 输出、业务处理结果和操作者复盘。 |
| 5 | win4r/OpenClaw-Skill | https://github.com/win4r/OpenClaw-Skill | OpenClaw debug workflow | 拒绝入库 | 知识型 Skill / references，缺一次 OpenClaw 部署、配对或 gateway 排障结果。 | 找到故障现象、排查步骤、修复提交或可访问结果。 |
| 6 | slowmist/openclaw-security-practice-guide | https://github.com/slowmist/openclaw-security-practice-guide | OpenClaw security practice | 拒绝入库 | 安全实践指南主题相关，但当前不可核验具体 Skill 检查样例或报告。 | 找到具体 audit target、检查输出、整改项和复测结果。 |
| 7 | affaan-m/ecc | https://github.com/affaan-m/ecc | Codex harness workflow | 拒绝入库 | 更像 harness / 性能优化系统介绍，缺单次任务输入、before/after 和交付产物。 | 找到使用 ECC 完成某个 Codex 任务的日志、产物和对比数据。 |
| 8 | DenisSergeevitch/agents-best-practices | https://github.com/DenisSergeevitch/agents-best-practices | AI coding workflow retrospection | 拒绝入库 | 方法论仓库，能沉淀规范，不能证明某个项目交付。 | 找到作者按该规范完成项目的 issue、PR、结果截图或复盘。 |
| 9 | metaskills/skill-design-guide | https://github.com/metaskills/skill-design-guide | Skill creation workflow | 拒绝入库 | Skill 设计指南，缺从需求到 Skill 到真实任务结果的闭环。 | 找到“用指南创建 Skill 并交付任务”的公开案例。 |
| 10 | mgechev/skills-best-practices | https://github.com/mgechev/skills-best-practices | Skills best-practices follow-up | 拒绝入库 | Best practices 内容，缺业务场景、输入数据和可见输出。 | 找到引用该 repo 的项目实践或作者后续案例。 |
| 11 | superpowers-developing-for-claude-code workflow example | https://github.com/obra/superpowers-developing-for-claude-code/blob/main/examples/full-featured-plugin/skills/workflow/SKILL.md | Claude Code plugin workflow | 拒绝入库 | 示例模板，不是一次真实项目交付。 | 找到插件 workflow 在真实 repo 中完成任务的 commit / PR / output。 |
| 12 | wshobson/agents docs/agent-skills.md | https://github.com/wshobson/agents/blob/main/docs/agent-skills.md | Agent Skills operational docs | 拒绝入库 | 文档页解释 Agent Skills specification，缺用户任务链路。 | 找到使用该 agents/skills 组合完成任务的公开复盘。 |
| 13 | openai/codex issue #5291 SKILL.md support | https://github.com/openai/codex/issues/5291 | Codex Skill support discussion | 拒绝入库 | Issue / feature request，只能证明需求，不能证明实践。 | 找到 workaround 被用于真实项目并产出结果的记录。 |
| 14 | anthropics/claude-code issue #50778 AGENTS.md + skills support | https://github.com/anthropics/claude-code/issues/50778 | multi-agent workflow pain point | 拒绝入库 | Proposal / 讨论，缺落地项目和产出。 | 找到讨论参与者后续 repo、任务日志或完成结果。 |
| 15 | React Router Agent Skill discussion | https://github.com/remix-run/react-router/discussions/14750 | framework-specific agent skill | 拒绝入库 | 官方 Skill 提案讨论，还不是已完成实践。 | 找到 React Router Agent Skill 被用于迁移、修 bug 或生成代码的结果。 |
| 16 | Agent Skills 傻瓜式教程 | https://juejin.cn/post/7599604510366236710 | 中文 Agent Skills 实战 query | 拒绝入库 | 入门教程属性强，主要讲安装和概念，真实项目输出弱。 | 找到教程作者或读者的项目输入、运行截图和最终交付物。 |
| 17 | Agent Skills 技术详解与实战 | https://juejin.cn/post/7624374842523566107 | 中文 Agent Skills 实战 query | 拒绝入库 | 标题含“实战”，正文仍偏机制介绍；缺可复核项目结果。 | 找到同作者项目 repo、输出截图、PR 或部署链接。 |
| 18 | Agent Skills 实战分享：AI 编程最后一公里 | https://juejin.cn/post/7600227607977852980 | 中文真实项目复盘 query | 拒绝入库 | 有经验分享味道，但缺明确 Skill 绑定、输入和可验证产出链路。 | 找到对应 Skill 文件、任务输入和交付结果。 |
| 19 | Agent Skills 工作流：从入门到实战 | https://juejin.cn/post/7600994087588053011 | 中文工作流复盘 query | 拒绝入库 | 工作流教程，偏架构说明；不是某次真实任务复盘。 | 找到具体项目中执行该 workflow 的日志、截图和成果。 |
| 20 | Cloudflare internal AI engineering stack | https://blog.cloudflare.com/internal-ai-engineering-stack/ | AI engineering stack retrospective | 拒绝入库 | 官方内部工程栈复盘有真实场景，但不是可复用 Agent Skill practice 单元。 | 找到 Cloudflare stack 中某个 Skill / workflow 的独立任务输入、过程和输出。 |

## 下一步最小证据缺口

| 方向 | 最小证据 | 可执行 query |
|---|---|---|
| ComfyUI | `prompt + workflow JSON + run log/history + generated image` | `"ComfyUI_Skills_OpenClaw" "prompt" "generated image"` |
| clawsec | `audit command + report/output + remediation diff + retest` | `"ClawSec" "audit output" "remediation"` |
| planning-with-files | `task_plan.md + progress.md + completed result + PR/deploy` | `"planning-with-files" "progress.md" "completed"` |
| 中文复盘 | `项目背景 + Skill 文件 + 执行截图 + 交付物` | `site:juejin.cn "Claude Code Skill" "项目复盘" "输出"` |
| GitHub 真实任务 | `SKILL.md + issue/PR + before/after + result` | `site:github.com "SKILL.md" "case study" "output" "before" "after"` |

## 验证

```bash
rg -n '^\| [0-9]+ \|' manage/practice-sourcing-result-2026-06-25.md
git status --short --branch
```
