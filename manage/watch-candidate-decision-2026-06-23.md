# Watch 候选判定（2026-06-23）

## 结论

截至 17:35 CST，本轮不新增 practice，`practice_total` 维持 `247`。

原因：`ComfyUI_Skills_OpenClaw`、`clawsec`、`planning-with-files` 都有继续观察价值，但当前公开证据仍主要证明“工具/Skill 能力存在”，没有证明“真实用户用它完成了一个具体任务并留下可核验输出”。按 `Skill x 场景 = 实践` 标准，宁可 0 新增，也不把目录、官方说明、命名撞车或方法论硬凑成 practice。

## 判定表

| 候选 | 判定 | 证据链接 | 不入库原因 | 下一步 query |
|---|---|---|---|---|
| `HuangYuChuh/ComfyUI_Skills_OpenClaw` | 继续观察 | https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw；https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw/tree/main/outputs；https://github.com/HuangYuChuh/ComfyUI_Skills_OpenClaw/tree/main/data；https://github.com/HuangYuChuh/ComfyUI_Skill_CLI；https://skillsllm.com/skill/comfyui-skills-openclaw | README 和 CLI 说明能证明它可把 ComfyUI workflow 暴露成 agent skill，并支持 import/run/status/history；仓库也有 `outputs/`、`data/` 等目录。但目前未看到一条可公开复盘的完整实践链：具体 prompt、workflow 输入、运行日志、生成图输出、任务目标和效果复盘。 | `"ComfyUI_Skills_OpenClaw" "prompt" "generated image"`；`"comfyui-skill run" "output" "prompt"`；`"comfyui-skill history" "generated"`；`"HuangYuChuh" "ComfyUI_Skills_OpenClaw" "demo"`；`site:bilibili.com "ComfyUI Skills for OpenClaw"` |
| `prompt-security/clawsec` | 继续观察，偏安全风险源 | https://github.com/prompt-security/clawsec；https://www.sentinelone.com/blog/clawsec-hardening-openclaw-agents-from-the-inside-out/；https://www.prompt.security/clawsec；https://github.com/openclaw/clawhub/issues/1824；https://www.techradar.com/pro/security/a-human-chosen-password-doesnt-stand-a-chance-openclaw-has-yet-another-major-security-flaw-heres-what-we-know-about-clawjacked | ClawSec 方向强相关，能证明 OpenClaw Skill 供应链、prompt injection、drift、unsafe runtime 是真实风险，也能证明该 suite 提供 integrity verification / automated audits。但当前证据仍是产品发布、安全研究和风险事件，没有一次真实扫描报告、整改日志、前后配置差异或运行后的 audit output。`clawhub` 命名冲突/风险讨论只能作为风险观察，不能作为实践案例。 | `"ClawSec" "audit output" "OpenClaw"`；`"clawsec" "scan report" "agent"`；`"prompt-security/clawsec" "results"`；`"ClawSec" "drift" "report"`；`"OpenClaw" "ClawSec" "hardening" "case study"` |
| `OthmanAdi/planning-with-files` | 继续观察 | https://github.com/OthmanAdi/planning-with-files；https://github.com/OthmanAdi/planning-with-files/blob/master/docs/quickstart.md；https://github.com/OthmanAdi/planning-with-files/releases；https://claudemarketplaces.com/skills/othmanadi/planning-with-files/planning-with-files；https://github.com/microsoft/semantic-link-labs/blob/main/.claude/skills/planning-with-files/SKILL.md | 仓库清楚说明 3-file pattern：`task_plan.md`、`findings.md`、`progress.md`，并给出 eval 指标，适合作为长任务状态管理方法论。但目前仍缺第三方项目的真实使用痕迹：`.plans/` 或 task files、任务前后对比、完成记录、PR/部署结果。官方 eval 可证明 skill fidelity，不等于 skill-cn 要收的用户实践。 | `"planning-with-files" "task_plan.md" "progress.md" "completed"`；`"planning-with-files" ".plans"`；`"OthmanAdi/planning-with-files" "case study"`；`"planning-with-files" "PR" "progress.md"`；`"planning-with-files" "used it to"` |

## 质量闸

- 不收目录页、awesome list、marketplace 镜像页。
- 不收 README 能力介绍，除非同时有具体任务、输入、输出和复盘。
- 不收官方发布稿或安全风险新闻本身，除非有可复用的检测/整改流程和结果。
- 不收命名相似或生态相关项目，必须能明确绑定到一个 Skill 的使用场景。

## 下一轮执行

1. `ComfyUI_Skills_OpenClaw` 只追 `prompt -> workflow -> run log/history -> generated image` 证据链。
2. `clawsec` 只追 `audit command -> report/output -> remediation` 证据链。
3. `planning-with-files` 只追 `task_plan.md/findings.md/progress.md -> completed task -> PR/deploy/result` 证据链。
4. 若下一轮仍找不到真实 output，三项从 P1 Watch 降级为 source pool，不再占用当日新增 practice KPI。
