# Practice Evidence Follow-up - 2026-06-26

## Conclusion

截至 17:20 CST，线上 `practice_total=247`，未达成今日 P0 `247 -> >=248`。本轮按兜底要求收口：不新增低证据 practice，落盘高潜线索和最小证据缺口，供下一轮直接追证或联系作者。

本质判断：当前公开供给仍以 Skill 仓库、awesome 目录、官方说明、教程和 proposal 为主；它们能证明生态活跃，但不能证明“用户用 Skill 完成真实任务”。practice 入库仍坚持 `input -> process -> output -> result` 链路。

## 入库硬标准

- 真实任务：明确解决某个研发、创作、运营、数据、安全或运维问题。
- Skill 绑定：能看到具体 Skill / workflow / agent skill / OpenClaw Skill 被调用。
- 输入可见：有 prompt、文件、issue、需求、待处理数据、目标系统或待扫描对象。
- 过程可见：有命令、运行日志、截图、状态文件、workflow JSON、计划文件或 PR。
- 输出可见：有生成物、报告、修复 diff、部署结果、前后对比或复盘结论。
- 可联系/可追踪：作者、repo、issue、discussion、文章平台或后续 query 可继续跟进。

## 高潜线索表

| # | 线索 | 当前证据 | 最小证据缺口 | 可联系作者 / 可追踪源 | 下一步动作 |
|---|---|---|---|---|---|
| 1 | `HuangYuChuh/ComfyUI_Skills_OpenClaw` | https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw | 缺 `prompt -> workflow JSON -> run log/history -> generated image -> 复盘`。 | GitHub author `HuangYuChuh`；repo issues；query `"ComfyUI_Skills_OpenClaw" "generated image" "prompt"`。 | 开 issue 或追作者动态，要求补一个完整生成案例截图和输入参数。 |
| 2 | `prompt-security/clawsec` | https://github.com/prompt-security/clawsec | 缺 `scan command -> report/output -> remediation diff -> retest result`。 | GitHub org `prompt-security`；repo issues/releases；query `"ClawSec" "scan report" "remediation"`。 | 追官方或用户是否发布 OpenClaw/Codex security audit 报告样例。 |
| 3 | `OthmanAdi/planning-with-files` | https://github.com/OthmanAdi/planning-with-files | 缺第三方真实任务的 `task_plan.md / progress.md / findings.md -> PR/deploy/result`。 | GitHub author `OthmanAdi`；repo issues；query `"planning-with-files" "progress.md" "completed"`。 | 联系作者补 examples，或搜 GitHub 代码中是否出现该 pattern 的完成记录。 |
| 4 | `box-community/openclaw-box-skill` | https://github.com/box-community/openclaw-box-skill | 缺真实文件输入、Box AI 处理过程、输出文档或业务结果。 | GitHub org `box-community`；Box developer examples；query `"openclaw-box-skill" "Box AI" "example"`。 | 追踪 Box 官方/社区 demo，要求补文件处理前后对比。 |
| 5 | `win4r/OpenClaw-Skill` | https://github.com/win4r/OpenClaw-Skill | 缺一次 OpenClaw 部署、gateway、pairing 或 tool-calls 排障的输入、步骤、修复结果。 | GitHub author `win4r`；repo issues；query `"win4r/OpenClaw-Skill" "debug" "fixed"`。 | 联系作者是否有排障日志；若有修复 commit 和复盘可转 practice。 |
| 6 | `slowmist/openclaw-security-practice-guide` | https://github.com/slowmist/openclaw-security-practice-guide | 缺具体 audit target、检查输出、整改项和复测结果。 | GitHub org `slowmist`；repo issues；query `"openclaw-security-practice-guide" "audit report"`。 | 追 SlowMist 是否发布实际 OpenClaw 安全检查案例。 |
| 7 | `affaan-m/ecc` | https://github.com/affaan-m/ecc | 缺使用 ECC 完成 Codex 任务的输入、执行日志、产物和 before/after 数据。 | GitHub author `affaan-m`；repo issues；query `"affaan-m/ecc" "before" "after" "output"`。 | 只追 task-level demo，不再评审 harness 介绍页。 |
| 8 | `superpowers-developing-for-claude-code` workflow example | https://github.com/obra/superpowers-developing-for-claude-code/blob/main/examples/full-featured-plugin/skills/workflow/SKILL.md | 缺 plugin workflow 在真实 repo 中完成任务的 commit / PR / output。 | GitHub author `obra`；repo examples/issues；query `"superpowers" "workflow" "Claude Code" "project" "output"`。 | 搜作者后续项目；若能找到应用该 workflow 的 PR，可转候选。 |
| 9 | `metaskills/skill-design-guide` | https://github.com/metaskills/skill-design-guide | 缺“按指南创建 Skill 并交付任务”的真实案例。 | GitHub org/user `metaskills`；repo issues；query `"skill-design-guide" "created a skill" "case study"`。 | 追引用方和 forks，不收指南本身。 |
| 10 | `wshobson/agents` agent skills docs | https://github.com/wshobson/agents/blob/main/docs/agent-skills.md | 缺用该 agents/skills 组合完成真实任务的输入、过程和结果。 | GitHub author `wshobson`；repo discussions/issues；query `"wshobson/agents" "case study" "output"`。 | 从 docs 反查具体 agent 子目录和用户复盘。 |
| 11 | React Router Agent Skill discussion | https://github.com/remix-run/react-router/discussions/14750 | 缺 React Router Agent Skill 被用于迁移、修 bug 或生成代码的结果。 | GitHub `remix-run/react-router` discussion；query `"React Router Agent Skill" "used" "project" "output"`。 | 追 discussion 后续链接；有官方 skill 或用户 PR 后再评审。 |
| 12 | 中文 Agent Skills 实战分享池 | https://juejin.cn/post/7600227607977852980 | 缺明确 Skill 文件、任务输入、执行截图、交付物和可核验项目链接。 | 掘金作者页、评论区、同作者后续文章；query `site:juejin.cn "Claude Code Skill" "项目复盘" "输出"`。 | 优先私信/评论追问项目 repo 或截图；教程正文不直接入库。 |

## 追证优先级

1. `ComfyUI_Skills_OpenClaw`：最接近“输入到生成图”的完整闭环，缺口最小。
2. `clawsec` / `slowmist`：安全实践价值高，但必须拿到扫描报告和整改链路。
3. `planning-with-files`：长任务状态管理契合 skill-cn 用户痛点，但需要第三方项目完成记录。
4. 中文实战分享池：更可能有作者可联系，但要避免泛教程污染实践库。

## 下一轮精准 Query

```text
"ComfyUI_Skills_OpenClaw" +"prompt" +"generated image"
"ComfyUI_Skills_OpenClaw" +"history" +"output"
"ClawSec" +"scan report" +"remediation"
"clawsec" +"audit output" +"OpenClaw"
"planning-with-files" +"task_plan.md" +"progress.md" +"completed"
"planning-with-files" +".plans" +"pull request"
"openclaw-box-skill" +"Box AI" +"workflow" +"example"
"OpenClaw Skill" +"debug" +"fixed" +"case study"
site:juejin.cn "Claude Code Skill" "项目复盘" "输出"
site:github.com "SKILL.md" "before" "after" "output" "case study"
```

## 当前验证

- `practice_total=247`
- `practice_weekly_new=0`
- 指标接口时间：`2026-06-26T09:12:20.565Z`
- 工作区基线：`master...origin/master`，落盘前无未提交变更。

