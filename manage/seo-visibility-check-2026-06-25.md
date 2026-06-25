# SEO Visibility Check - 2026-06-25

检查时间：`2026-06-25 14:18 CST`

目标页：`https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls`

## 1. 结论

P0 结论：目标页的基础可抓取链路是通的，但 GSC 搜索表现尚未起量。

- GSC 凭证：可用，使用 `manage/gsc-key.json` 服务账号查询 `sc-domain:skill-cn.com`。
- 全站 7 天：`144` 点击，`3657` 展现，CTR `3.94%`，平均排名 `9.57`。
- 全站 28 天：`997` 点击，`23964` 展现，CTR `4.16%`，平均排名 `8.60`。
- 目标页 7 天：`0` 点击，`0` 展现。
- 目标页 28 天：`0` 点击，`0` 展现。
- Sitemap：线上 `/sitemap.xml` 返回 `200`，共 `303` 个 `<loc>`，目标页命中 `1` 次。
- Robots：线上 `/robots.txt` 允许 `/`，仅阻断 `/api/`、`/auth/`，并声明 `Sitemap: https://www.skill-cn.com/sitemap.xml`。
- Canonical：目标页自引用 `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls`。
- 站内入口：首页 HTML 中可抓到目标页链接，但入口权重偏弱，主要来自通用导航/页脚链路，不是主题集群内链。

## 2. GSC 数据

数据范围以查询当天的前一日为结束日，即 `2026-06-24`。

| 范围 | 起止日期 | 点击 | 展现 | CTR | 平均排名 |
| --- | --- | ---: | ---: | ---: | ---: |
| 全站 7 天 | `2026-06-18` - `2026-06-24` | 144 | 3657 | 3.94% | 9.57 |
| 全站 28 天 | `2026-05-28` - `2026-06-24` | 997 | 23964 | 4.16% | 8.60 |
| 目标页 7 天 | `2026-06-18` - `2026-06-24` | 0 | 0 | 0.00% | 0.00 |
| 目标页 28 天 | `2026-05-28` - `2026-06-24` | 0 | 0 | 0.00% | 0.00 |

28 天 Top pages：

| 页面 | 点击 | 展现 | CTR | 平均排名 |
| --- | ---: | ---: | ---: | ---: |
| `/` | 224 | 4901 | 4.6% | 10.9 |
| `/practice/13` | 44 | 436 | 10.1% | 6.7 |
| `/practice/67` | 34 | 406 | 8.4% | 7.4 |
| `/practice/24` | 32 | 833 | 3.8% | 6.9 |
| `/practice/125` | 31 | 344 | 9.0% | 7.1 |

28 天 Top queries：

| Query | 点击 | 展现 | CTR | 平均排名 |
| --- | ---: | ---: | ---: | ---: |
| `skill 网站` | 17 | 431 | 3.9% | 5.8 |
| `skills hub` | 16 | 354 | 4.5% | 5.4 |
| `skills 官网` | 13 | 126 | 10.3% | 7.0 |
| `skillshub` | 11 | 207 | 5.3% | 6.9 |
| `skill网站` | 11 | 215 | 5.1% | 6.4 |

GSC Sitemap 状态：

| Sitemap | Last submitted | Submitted | Indexed |
| --- | --- | ---: | ---: |
| `https://www.skill-cn.com/sitemap.xml` | `2026-03-15T11:51:40.532Z` | 303 | 0 |

说明：GSC Sitemap 报告仍显示 `indexed=0`，但 Search Analytics 已有 practice 页点击，说明 Search Analytics 与 Sitemap indexed 口径不同。这里不把 `indexed=0` 解读为全站未索引，只作为 sitemap 报告异常/滞后信号继续跟踪。

## 3. 目标页技术检查

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| HTTP 状态 | 通过 | `HTTP/2 200`，`x-matched-path: /seo/openclaw-wsl2-codex-tool-calls` |
| 页面缓存 | 通过 | `x-vercel-cache: PRERENDER` |
| Title | 通过 | `OpenClaw WSL2 与 Codex Tool Calls 排查指南 | skill-cn | Skill Hub 中国` |
| Meta robots | 通过 | `index, follow` |
| Canonical | 通过 | `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls` |
| OG URL | 通过 | `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls` |
| JSON-LD | 通过 | 页面包含 `application/ld+json` |
| Sitemap | 通过 | 目标 URL 在 `/sitemap.xml` 中命中 `1` 次 |
| Robots | 通过 | `Allow: /`，未阻断 `/seo/`，声明 sitemap |
| 站内入口 | 基本通过 | 首页 HTML 可抓到目标页 href；但缺少主题相关 practice/skill 的强内链 |

## 4. 可执行优化机会

1. 增强主题集群内链，优先从已有高表现 practice 页链入目标页。
   - 候选来源：`/practice/13`、`/practice/67`、`/practice/24`、`/practice/125`、`/practice/111`。
   - 动作：在相关 practice 详情页下方增加“相关排查指南/Agent Skills 基础设施”模块，锚文本覆盖 `Codex tool calls 排查`、`OpenClaw WSL2`、`Agent Skills directory`。
   - 预期：把已有可索引 practice 流量传给新 SEO 页，缩短新页发现周期。

2. 把目标页加入首页可见入口，而不是只依赖弱导航/页脚入口。
   - 动作：在首页更新看板或精选区增加一个轻量“OpenClaw / Codex 排查指南”入口。
   - 约束：首页 title 不改，避免影响当前品牌词流量。
   - 预期：提升内链权重和用户点击信号。

3. 追加 2-3 个长尾段落，覆盖当前页面未充分命中的问题型 query。
   - 候选 H2：`Codex MCP tools not showing 怎么查`、`Codex Windows WSL2 路径混用怎么排查`、`OpenClaw dynamic tools 和 MCP tools 区别`。
   - 动作：每段给出 5 步以内的可执行 checklist，并链接官方文档。
   - 预期：扩大非品牌长尾曝光面。

4. 在 GSC 手动请求目标 URL 编入索引，并重新提交 sitemap。
   - 动作：使用 GSC URL inspection 手动提交 `https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls`；sitemap 重新提交当前 303 URLs。
   - 预期：目标页目前 0 展现，手动提交能排除“已发现但未抓取”的不确定性。

5. 建立 7/14/28 天固定复测。
   - 动作：每周记录目标页 page filter 的 clicks/impressions/query rows，同时追踪 `OpenClaw WSL2`、`Codex tool calls`、`Agent Skills directory` 三组 query。
   - 触发条件：若 14 天仍 0 展现，优先做内链和内容扩写；若有展现无点击，优先改 title/description。

## 5. 验证命令

```bash
node manage/gsc-query.js "sc-domain:skill-cn.com"
```

```bash
node <<'NODE'
const { google } = require('googleapis');
const path = require('path');
const siteUrl = 'sc-domain:skill-cn.com';
const target = 'https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls';
function date(offset) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0,10); }
async function q(body) {
  const auth = new google.auth.GoogleAuth({ keyFile: path.join(__dirname, 'manage/gsc-key.json'), scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const sc = google.searchconsole({ version: 'v1', auth });
  const res = await sc.searchanalytics.query({ siteUrl, requestBody: body });
  return res.data.rows || [];
}
async function summary(days) {
  const rows = await q({ startDate: date(-days), endDate: date(-1), rowLimit: 1 });
  console.log(days, rows[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 });
}
async function targetPage(days) {
  const rows = await q({
    startDate: date(-days),
    endDate: date(-1),
    dimensions: ['query'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: target }] }],
    rowLimit: 25,
  });
  console.log('target', days, rows);
}
(async () => { await summary(7); await summary(28); await targetPage(7); await targetPage(28); })();
NODE
```

```bash
curl -sS -D /tmp/skill-cn-target.headers -o /tmp/skill-cn-target.html \
  https://www.skill-cn.com/seo/openclaw-wsl2-codex-tool-calls
curl -sS -D /tmp/skill-cn-sitemap.headers -o /tmp/skill-cn-sitemap.xml \
  https://www.skill-cn.com/sitemap.xml
curl -sS -D /tmp/skill-cn-robots.headers -o /tmp/skill-cn-robots.txt \
  https://www.skill-cn.com/robots.txt
curl -sS -D /tmp/skill-cn-home.headers -o /tmp/skill-cn-home.html \
  https://www.skill-cn.com/

rg -o '<title>[^<]+|rel="canonical" href="[^"]+|name="robots" content="[^"]+|property="og:url" content="[^"]+' /tmp/skill-cn-target.html
rg -c 'https://www\.skill-cn\.com/seo/openclaw-wsl2-codex-tool-calls' /tmp/skill-cn-sitemap.xml
rg -n 'Sitemap|Disallow|Allow' /tmp/skill-cn-robots.txt
rg -n 'seo/openclaw-wsl2-codex-tool-calls|OpenClaw|Codex|tool calls' /tmp/skill-cn-home.html
```
