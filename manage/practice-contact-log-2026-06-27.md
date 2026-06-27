# Practice Contact Log - 2026-06-27

## Conclusion

截至 13:10 CST，已对 `practice-evidence-followup-2026-06-26.md` 前 `3` 条线索执行首轮追证。当前没有任何一条满足 `input -> process -> output -> result` 的完整公开证据链，因此暂不新增 practice，`practice_total` 仍为 `247`。

本轮不扩大关键词池，只处理：

1. `HuangYuChuh/ComfyUI_Skills_OpenClaw`
2. `prompt-security/clawsec`
3. `OthmanAdi/planning-with-files`

## 追证记录

| # | 线索 | 已执行动作 | 结果 | 当前状态 | 下一步 |
|---|---|---|---|---|---|
| 1 | `HuangYuChuh/ComfyUI_Skills_OpenClaw` | GitHub code search：`ComfyUI_Skills_OpenClaw prompt generated image`；GitHub issue search：`"ComfyUI_Skills_OpenClaw" "generated image"`；查看 repo issues。 | code / issue search 未返回完整输出链路；发现 issue #129 提供 Socialistic 在线试跑入口，能证明“可直接跑 workflow”，但公开正文只描述平台会话价值，未给出具体 prompt、workflow history、generated image 或复盘。 | 继续追证，不入库。 | 联系作者或 issue #129 作者，索取一条公开示例：prompt、workflow/schema、history/log、生成图、结论。 |
| 2 | `prompt-security/clawsec` | GitHub code search：`ClawSec scan report remediation`；GitHub issue search：`"clawsec" "scan report" remediation`；查看最新相关 issue #269。 | search 未返回 audit report / remediation / retest；issue #269 是 fail-closed dispatch boundary / signed receipt 的 gap 讨论，collaborator 明确表示当前 clawsec 不支持或不承认该 gap，后续因 stale 关闭。 | 继续追证，不入库。 | 追官方或用户是否有 `scan command -> report -> remediation diff -> retest` 样例；可补问 scan report 样例是否公开。 |
| 3 | `OthmanAdi/planning-with-files` | GitHub code search：`planning-with-files progress.md completed`；GitHub issue search：`"planning-with-files" "task_plan.md" "progress.md"`；查看 repo 状态和近期 issues。 | search 未返回第三方完成记录；repo issues 近期多为插件/安装/协作询问，不包含 `task_plan.md / progress.md / findings.md -> PR/deploy/result` 闭环。 | 继续追证，不入库。 | 联系作者补 examples，或请求一条第三方项目完成记录，重点是状态文件和最终 PR/部署结果。 |

## 可复用触达模板

### 1. ComfyUI_Skills_OpenClaw

```text
Hi @HuangYuChuh,

I am collecting real-world Agent Skill practices for skill-cn. Your ComfyUI skill is a strong candidate because it turns a ComfyUI workflow into a callable agent contract.

Do you have one public example with:

- input prompt / parameters
- workflow or schema used
- run history / command log
- generated image output
- short result notes or lessons learned

Issue #129 mentions a Socialistic online runner. If there is one shareable run trace or example output, I can cite the original source and turn it into a high-quality practice case instead of treating the repo as a generic tool listing.
```

### 2. clawsec

```text
Hi prompt-security team,

I am looking for a public, reproducible ClawSec practice case rather than a generic security-tool listing.

Is there any example that shows:

- scan command or target
- report / audit output
- remediation diff or recommended fix
- retest result after remediation

Without this chain I will keep ClawSec as a watch item, not a practice case. A small sanitized audit example is enough if it can be publicly linked.
```

### 3. planning-with-files

```text
Hi @OthmanAdi,

I am evaluating planning-with-files as a real practice case for long-running AI coding tasks.

Do you have a public project example where the file-based plan was used through completion, ideally showing:

- task_plan.md
- progress.md / findings.md
- the final PR, deployment, or completed deliverable
- short before/after or reliability notes

The repo explains the pattern clearly, but I need a completed task trace before treating it as a practice rather than a tool/method page.
```

## 入库判断

- `ComfyUI_Skills_OpenClaw`：最接近入库，但仍缺公开 output。
- `clawsec`：安全价值高，但当前证据仍是 capability / discussion，不是 audit practice。
- `planning-with-files`：场景契合，但仍缺第三方 completed task trace。

下一轮只在这三条上继续追公开证据或执行作者触达，不扩展到教程、目录或官方说明。
