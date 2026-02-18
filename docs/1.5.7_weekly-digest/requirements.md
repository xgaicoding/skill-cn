# v1.5.7 — Banner 区升级 + 本周上新

## 一、背景与问题

### 当前 Banner 区现状
- **Hero 区**（`FeaturedCarousel`）：精选实践卡片轮播 + 静态 slogan，功能单一
- **PracticeDiscoveryBanner**：引导用户发现实践模式，看过一次永久消失，位置浪费
- **整体问题**：用户每次来看到的都一样，没有"新鲜感"，感受不到网站在持续更新

### 要解决的核心问题
1. **用户没有回访动机** — 不知道有新内容，不知道为什么要回来
2. **Banner 区信息密度低** — 黄金位置只做了一件事（轮播精选）
3. **缺少传播载体** — 没有可分享的内容物，Growth Loop 断裂

---

## 二、目标

| 维度 | 目标 |
|------|------|
| 留存 | 通过"本周上新"给用户回访理由，建立周回访习惯 |
| 传播 | 周报卡片可分享，形成 内容→分享→新用户 的 Growth Loop |
| 活力感 | 动态数据让用户感知"这个站是活的"，增强信任 |

---

## 三、功能模块

### 模块 1：动态数据条（WeeklyStatsBar）

**定位**：替代原 `PracticeDiscoveryBanner`，常驻显示，不再是一次性引导。

**展示内容**：
```
🆕 本周上新 X 篇实践 · 共收录 Y 篇 · Z 个 Skill
```

**交互**：
- 点击"本周上新 X 篇"→ 自动切换到实践模式 + 按"最新"排序
- 常驻显示，不可关闭（核心信号：**这个站在持续更新**）

**数据来源**：
- 本周上新数：`practices` 表 `updated_at >= 本周一 00:00`，`is_listed = true`
- 总收录数：`practices` 表 `is_listed = true` 的 count
- Skill 总数：`skills` 表 `is_listed = true` 的 count

**位置**：
- PC 端：Hero 区下方、筛选条上方（原 PracticeDiscoveryBanner 位置）
- 移动端：Hero 轮播下方、筛选 Toolbar 上方

**视觉**：
- 单行通栏，左侧 🆕 icon，文字居中
- 背景色：浅蓝/浅紫渐变（与 Hero 区视觉衔接），不能太抢眼但要能注意到
- 本周上新数字加粗高亮

**降级**：
- 本周上新 0 篇时，显示"本周暂无新实践 · 共收录 Y 篇 · Z 个 Skill"
- API 失败时，整个组件隐藏（不影响页面）

---

### 模块 2：实践卡片 🆕 角标

**规则**：最近 7 天内入库的实践（`updated_at` 距今 ≤ 7 天），在卡片右上角显示 🆕 角标。

**影响范围**：
- PC 实践模式列表卡片（`PracticeFeedCard`）
- 移动端实践卡片
- Hero 精选轮播卡片（`FeaturedCarousel`）

**视觉**：
- 小圆角标签，背景色亮绿或亮橙，文字"NEW"或"🆕"
- 位置：卡片右上角，绝对定位
- 7 天后自动消失（前端根据 `updated_at` 计算，无需后端额外字段）

---

### 模块 3：周报卡片（WeeklyDigestCard）

**定位**：每周自动生成的内容聚合卡片，是 **Growth Loop 的传播载体**。

**展示内容**：
```
📰 skill-cn 周报 | 第 N 周
━━━━━━━━━━━━━━━━━
本周上新 X 篇实践

🔥 热门 Top 3
1. 《文章标题1》
2. 《文章标题2》  
3. 《文章标题3》

💡 一句话总结
"本周 Cursor 相关实践最火，XX 场景被大量验证..."

📊 累计收录 Y 篇实践 · Z 个 Skill
━━━━━━━━━━━━━━━━━
skill-cn.com — AI 实践方案发现平台
```

**生成规则**：
- 每周一 00:00 自动生成（定时任务 / 首次访问时懒生成）
- 数据来源：上一周（周一~周日）的 practices 数据
- 热门 Top3：按 `click_count` 降序取前 3
- 一句话总结：AI 生成（DeepSeek），基于本周入库实践的 Skill 分布和标题
- 周序号：当年第几周（ISO week number）

**展示位置**：
- Hero 精选轮播的**第一张卡片**（固定位置，不参与自动轮播排序）
- 视觉风格与精选卡片统一，但有"周报"标识区分

**分享功能**：
- 卡片底部"分享"按钮
- 点击后生成图片（使用 html2canvas 或 server-side 渲染）
- 图片可长按保存 / 分享到微信朋友圈
- 图片底部带 skill-cn.com 域名 + 二维码（引流回站）

**存储**：
- 新增 `weekly_digests` 表（或 JSON 文件缓存），避免每次实时计算
- 字段：`week_number`, `year`, `new_count`, `top_practices`, `summary`, `generated_at`

**降级**：
- 上周无新实践 → 不生成周报卡片（轮播区正常显示精选实践）
- AI 总结失败 → 用默认模板文案替代

---

## 四、API 设计

### 4.1 GET /api/stats/weekly

**用途**：供动态数据条使用。

**响应**：
```json
{
  "newPracticesThisWeek": 5,
  "totalPractices": 116,
  "totalSkills": 52,
  "weekStart": "2026-02-16",
  "weekEnd": "2026-02-22"
}
```

**缓存策略**：`Cache-Control: public, max-age=300`（5 分钟缓存，平衡实时性与性能）

### 4.2 GET /api/weekly-digest?week=2026-W08

**用途**：获取指定周的周报数据。

**响应**：
```json
{
  "year": 2026,
  "week": 8,
  "newCount": 5,
  "topPractices": [
    { "id": 116, "title": "...", "click_count": 234, "source_url": "..." },
    { "id": 112, "title": "...", "click_count": 189, "source_url": "..." },
    { "id": 108, "title": "...", "click_count": 156, "source_url": "..." }
  ],
  "summary": "本周 Cursor 相关实践最火...",
  "generatedAt": "2026-02-23T00:00:00Z"
}
```

**逻辑**：
- 无参数时返回最新一期（上周）
- 懒生成：首次请求时生成并缓存到数据库，后续直接返回

### 4.3 GET /api/weekly-digest/image?week=2026-W08

**用途**：生成周报分享图片。

**响应**：PNG 图片（宽 750px，适配微信朋友圈）

**实现方案**（二选一，技术方案阶段确定）：
- 方案 A：Server-side 使用 `@vercel/og`（基于 Satori）生成
- 方案 B：前端 `html2canvas` 截图

---

## 五、数据库变更

### 新增表：weekly_digests

```sql
CREATE TABLE weekly_digests (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week INTEGER NOT NULL,
  new_count INTEGER NOT NULL DEFAULT 0,
  top_practices JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(year, week)
);
```

---

## 六、埋点

| 事件名 | 触发时机 | 参数 |
|--------|----------|------|
| `stats_bar_show` | 动态数据条展示 | `new_count`, `total_practices` |
| `stats_bar_click` | 点击"本周上新" | `new_count` |
| `new_badge_show` | 🆕 角标卡片曝光 | `practice_id` |
| `new_badge_click` | 点击带 🆕 角标的卡片 | `practice_id` |
| `digest_show` | 周报卡片曝光 | `year`, `week` |
| `digest_share` | 点击周报分享按钮 | `year`, `week` |
| `digest_share_complete` | 分享图片生成成功 | `year`, `week` |

---

## 七、影响范围

| 文件/组件 | 改动类型 | 说明 |
|-----------|----------|------|
| `PracticeDiscoveryBanner` | **替换** | 替换为 `WeeklyStatsBar` |
| `FeaturedCarousel` | 修改 | 加入周报卡片 + 🆕 角标 |
| `PracticeFeedCard` | 修改 | 加 🆕 角标 |
| `HomePage` | 修改 | 引入 `WeeklyStatsBar`，传入周报数据 |
| `HomeMobileView` | 修改 | 移动端适配动态数据条 + 🆕 角标 |
| `/api/stats/weekly` | **新增** | 周统计 API |
| `/api/weekly-digest` | **新增** | 周报数据 API |
| `/api/weekly-digest/image` | **新增** | 周报图片生成 API |
| `weekly_digests` 表 | **新增** | 周报数据存储 |
| `lib/constants.ts` | 修改 | 新增上新天数阈值常量 |
| `lib/types.ts` | 修改 | 新增 `WeeklyStats`、`WeeklyDigest` 类型 |

---

## 八、里程碑

| 阶段 | 内容 | 预估时间 |
|------|------|----------|
| P1 | 动态数据条 + 🆕 角标（核心：让用户感知"有新内容"） | 1 天 |
| P2 | 周报卡片生成 + 轮播集成（核心：传播载体） | 1.5 天 |
| P3 | 分享图片生成 + 移动端适配 | 1 天 |
| 联调 | 整体联调 + 埋点验证 | 0.5 天 |
| **合计** | | **4 天** |

**优先级**：P1 > P2 > P3。P1 完成即可上线，P2/P3 可渐进发布。

---

## 九、验收指标

| 指标 | 定义 | 目标 |
|------|------|------|
| 数据条点击率 | stats_bar_click / 首页 PV | > 5% |
| 🆕 角标点击率提升 | 带角标卡片 CTR vs 普通卡片 CTR | 提升 > 20% |
| 周报卡片分享率 | digest_share / digest_show | > 2% |
| 周回访率 | 同一用户 7 天内再次访问 / 周活跃用户 | 基线待建立，上线后追踪 |

---

## 十、技术风险

| 风险 | 影响 | 应对 |
|------|------|------|
| 周报图片生成性能 | 服务端生成可能耗时较长 | 预生成 + CDN 缓存；或改用前端截图方案 |
| 本周上新 0 篇 | 数据条显得"冷清" | 降级文案处理，保留总数展示 |
| AI 生成摘要质量 | 一句话总结可能不够精准 | 备用模板文案兜底 |
| `PracticeDiscoveryBanner` 下线 | 新用户失去实践模式引导 | 数据条本身包含实践入口，点击可切换模式 |
