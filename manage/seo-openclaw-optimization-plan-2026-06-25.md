# OpenClaw SEO Optimization Plan - 2026-06-25

目标页：`/seo/openclaw-wsl2-codex-tool-calls`

基线：GSC 7/28 天均 `0` 展现；抓取链路正常。

## 排期

| 优先级 | 动作 | 排期 | 验收口径 | 状态 |
| --- | --- | --- | --- | --- |
| P0 | 主题集群内链 | `2026-06-25` | 目标页新增相关 practice 内链；锚文本覆盖 Codex/OpenClaw/Agent Skills/tool calls | 已实施 |
| P0 | 首页可见入口 | `2026-06-25` | 首页 PC 首屏更新看板新增可见专题入口；保留首页 title 不变 | 已实施 |
| P1 | 长尾段落扩写 | `2026-06-26` | 新增 2-3 个问题型 H2，覆盖 `Codex MCP tools not showing`、`Windows WSL2 路径混用`、`OpenClaw dynamic tools vs MCP tools` | 待做 |
| P1 | GSC 手动提交 | `2026-06-26` | URL inspection 请求索引；重新提交 sitemap；记录控制台结果 | 待做 |
| P1 | 7/14/28 天复测 | `2026-07-02` / `2026-07-09` / `2026-07-23` | 记录目标页 page filter clicks/impressions/query rows；若 14 天仍 0 展现，继续加内链与内容 | 待做 |

## 本次实施范围

1. 首页可见入口：
   - 文件：`components/home/HomeRetentionBanner.tsx`
   - 位置：PC 首屏更新看板
   - 链接：`/seo/openclaw-wsl2-codex-tool-calls`
   - 埋点：`home_seo_guide_click`

2. 主题集群内链：
   - 文件：`app/seo/openclaw-wsl2-codex-tool-calls/page.tsx`
   - 新增“相关实践入口”
   - 链接到 `/practice/193`、`/practice/194`、`/practice/168`、`/practice/125`

3. 样式：
   - 文件：`app/globals.css`
   - 新增首页专题入口样式和目标页相关实践卡片样式
   - 移动端相关实践网格降为单列

## 下一次复测命令

```bash
node manage/gsc-query.js "sc-domain:skill-cn.com"
```

```bash
rg -n 'home_seo_guide_click|seo-related-card|openclaw-wsl2-codex-tool-calls' \
  components/home/HomeRetentionBanner.tsx \
  app/seo/openclaw-wsl2-codex-tool-calls/page.tsx \
  app/globals.css
```
