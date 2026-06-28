# SEO GSC Opportunity - 2026-06-28

## Conclusion

本轮使用 Google Search Console 最近 28 天数据（`2026-05-31` 至 `2026-06-27`）做不依赖外部回复的 SEO 小闭环。选择目标为 `/practice/24`，原因是该页面已有稳定展现和前 10 排名，但 CTR 偏低，适合做低成本标题/摘要/FAQ 优化。

本次产出为分析文件，不直接改数据库内容。原因：`/practice/[id]` 的 title / summary 来自 Supabase `practices` 表，代码层没有单页静态文案可直接改；贸然改动态模板会影响全部 practice 页面，超出本次小闭环范围。

## GSC 数据

| 维度 | Query / Page | Clicks | Impressions | CTR | Position | 判断 |
|---|---|---:|---:|---:|---:|---|
| page | `https://www.skill-cn.com/practice/24` | `34` | `849` | `4.00%` | `6.86` | 页面级展现高、排名前 10，但 CTR 低于同批 practice 详情页。 |
| query + page | `剪映 skill` -> `/practice/24` | `1` | `35` | `2.86%` | `8.11` | 明确的中文长尾需求，排名可见但点击弱。 |
| query + page | `剪映skills` -> `/practice/24` | `3` | `22` | `13.64%` | `8.50` | 同义 query 能点击，说明页面与搜索意图相关。 |

对比样本：

- `/practice/13`：`451` impressions，CTR `9.98%`，position `6.47`。
- `/practice/67`：`444` impressions，CTR `9.23%`，position `6.73`。
- `/practice/125`：`336` impressions，CTR `10.71%`，position `6.36`。

`/practice/24` 的 position 接近这些页面，但 CTR 只有约一半，优先级成立。

## 当前页面信号

Live metadata:

```text
title: 告别剪映！Claude Skills能直接剪辑视频了 | Skill Hub 中国
description: 告别剪映，用 Claude Skills 直接剪视频： Remotion 把“写代码剪视频”封装成 Skill，一句自然语言就能生成动画与成片， 从终端演示到混剪大片全自动完成， 这篇文章手把手展示 Skills 如何把视频创作门槛直接拉到...
canonical: https://www.skill-cn.com/practice/24
related skill: remotion-best-practices
```

判断：

- Title 已包含“剪映”和“Claude Skills”，不用优先改模板。
- Description 覆盖了“剪映 / Claude Skills / Remotion / 直接剪视频”，但尾部被截断，搜索结果摘要可能没有明确回答“这是哪个 Skill、能替代剪映做什么”。
- 页面没有针对 `剪映 skill` 的独立 FAQ / H2，因为 practice 详情页正文来自结构化摘要和卡片布局，不适合在代码层硬编码单页内容。

## Recommended Action

低风险动作顺序：

1. 在 Supabase 中微调 `practice_id=24` 的 `summary`，前 100 字明确包含：
   - `剪映 skill`
   - `Claude Skills 剪视频`
   - `Remotion skill`
   - `一句话生成视频 / 动画 / 成片`
2. 若后续要代码化解决，给 practice 详情页增加可选 `seo_faq` / `seo_notes` 字段，而不是为单页写死逻辑。
3. 7 天后复查 query `剪映 skill`：
   - 目标 CTR：`2.86% -> >=6%`
   - 目标 position：保持 `<=9`
   - 若 CTR 不升，再考虑 title 从 `告别剪映！Claude Skills能直接剪辑视频了` 调整为更直给的 `剪映 Skill 替代方案：用 Claude Skills + Remotion 直接剪视频`

## Why Not Choose Other Opportunities

- 首页相关 query（如 `skill 中文`、`skills`、`skill hub`）：首页 title 已被明确要求不要改，且品牌词/泛词混杂，不适合作为今天的小闭环。
- `/practice/202` 的 `github r-skill-hub...` 系列：impressions 高但 query 太窄，疑似 repo / 特定项目查找意图；当前不确定是否符合 skill-cn 主定位，先观察。
- `/skill/10` 的 `ai 前端设计`：impressions 低于 10，样本太小。

## Verification

```bash
node manage/gsc-query.js "sc-domain:skill-cn.com"
curl -sS https://www.skill-cn.com/practice/24
```

本文件完成今日 P1 的分析闭环：给出 `query/page/impressions/position/action`，并把下一步限制在单页数据字段或可选 SEO 字段，避免扩大到全站模板改造。
