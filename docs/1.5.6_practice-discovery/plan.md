# v1.5.6 实践模式可发现性优化 实施计划

> 版本：1.5.6 | 日期：2026-02-13 | 负责人：TBD

---

## 一、技术方案

### 1.1 首页引导 Banner

**组件设计**：
```tsx
// components/home/PracticeDiscoveryBanner.tsx
export default function PracticeDiscoveryBanner({
  onTryNow: () => void;
  onClose: () => void;
}) {
  // localStorage key: 'skillhub_practice_banner_seen_v1'
  // 自动淡出：3秒后 opacity: 0，再 300ms 后 display: none
}
```

**集成位置**：
- `components/home/HomePage.tsx` 中，Header 下方、主内容区域上方
- 仅在桌面端渲染（`deviceKind !== 'mobile'`）
- 检查 localStorage，如果已关闭则不渲染

**样式**：
- 浅色背景 + 渐变边框（复用现有设计系统）
- 高度：60px（不占用太多空间）
- 动画：fade-in 300ms，fade-out 300ms

---

### 1.2 ModeDock 文案优化

**修改文件**：
- `components/home/ModeDock.tsx`

**改动**：
```tsx
// 原：
<span className="mode-dock__label">实践模式</span>
<span className="mode-dock__label">Skill 模式</span>

// 改为：
<span className="mode-dock__label">看案例</span>
<span className="mode-dock__label">找工具</span>
```

**aria-label 同步更新**：
```tsx
aria-label="切换到看案例"
aria-label="切换到找工具"
```

---

### 1.3 实践模式价值主张

**修改文件**：
- `components/home/HomePage.tsx`

**实现**：
```tsx
{mode === 'practices' && (
  <div className="practice-mode-header">
    <p className="practice-mode-tagline">
      💡 真实案例 · 实战方案 · 快速上手
    </p>
  </div>
)}

{mode === 'practices' && practices.length < 6 && (
  <div className="practice-empty-guide">
    <p>📝 实践案例持续更新中...</p>
    <p>想分享你的实战经验？</p>
    <a href={SKILL_ISSUE_URL} target="_blank" rel="noopener noreferrer">
      投稿实践案例 →
    </a>
  </div>
)}
```

**样式**：
- `.practice-mode-header`：居中，灰色文字，小字号
- `.practice-empty-guide`：卡片样式，居中，引导性文案

---

### 1.4 数据埋点

**工具选择**：
- 使用 Vercel Analytics（已集成 `@vercel/analytics`）
- 或者直接用 Supabase 记录事件（更灵活）

**埋点封装**：
```tsx
// lib/analytics.ts
export function trackEvent(
  event: string,
  properties?: Record<string, any>
) {
  // Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', event, properties);
  }
  
  // 或者 Supabase
  // supabase.from('analytics_events').insert({ event, properties, ... })
}
```

**埋点位置**：

1. **模式切换**（`ModeDock.tsx`）：
```tsx
onClick={() => {
  trackEvent('mode_switch', {
    from: mode,
    to: 'practices'
  });
  onChange('practices');
}}
```

2. **Banner 展示**（`PracticeDiscoveryBanner.tsx`）：
```tsx
useEffect(() => {
  trackEvent('banner_show', {
    type: 'practice_discovery'
  });
}, []);
```

3. **Banner 点击**（`PracticeDiscoveryBanner.tsx`）：
```tsx
onClick={() => {
  trackEvent('banner_click', {
    type: 'practice_discovery',
    action: 'try_now'
  });
  onTryNow();
}}
```

4. **实践卡片点击**（`PracticeFeedCard.tsx`）：
```tsx
onClick={() => {
  trackEvent('practice_card_click', {
    practice_id: practice.id,
    action: 'view_original'
  });
  trackClick(); // 现有的点击统计
}}
```

5. **页面停留时长**（`HomePage.tsx`）：
```tsx
useEffect(() => {
  const startTime = Date.now();
  return () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    trackEvent('page_view_duration', {
      mode,
      duration_seconds: duration
    });
  };
}, [mode]);
```

---

## 二、开发任务拆解

### Phase 1：基础功能（2天）

| 任务 | 负责人 | 工时 | 依赖 |
|------|--------|------|------|
| 创建 PracticeDiscoveryBanner 组件 | TBD | 4h | - |
| 集成 Banner 到 HomePage | TBD | 2h | Banner 组件 |
| ModeDock 文案优化 | TBD | 1h | - |
| 实践模式价值主张文案 | TBD | 2h | - |
| 样式调整与适配 | TBD | 3h | 以上组件 |

**小计**：12h（1.5 工作日）

---

### Phase 2：数据埋点（1天）

| 任务 | 负责人 | 工时 | 依赖 |
|------|--------|------|------|
| 封装 trackEvent 工具函数 | TBD | 2h | - |
| 模式切换埋点 | TBD | 1h | trackEvent |
| Banner 埋点 | TBD | 1h | trackEvent |
| 实践卡片埋点 | TBD | 1h | trackEvent |
| 页面停留时长埋点 | TBD | 2h | trackEvent |
| 埋点测试与验证 | TBD | 1h | 以上埋点 |

**小计**：8h（1 工作日）

---

### Phase 3：测试与优化（0.5天）

| 任务 | 负责人 | 工时 | 依赖 |
|------|--------|------|------|
| 功能测试（桌面端） | TBD | 1h | Phase 1 |
| 功能测试（移动端） | TBD | 1h | Phase 1 |
| 埋点数据验证 | TBD | 1h | Phase 2 |
| 性能测试（GPU/内存） | TBD | 1h | Phase 1 |

**小计**：4h（0.5 工作日）

---

**总工时**：24h（3 工作日）

---

## 三、时间规划

| 日期 | 阶段 | 产出 |
|------|------|------|
| 2026-02-13（今天） | 需求评审 | requirements.md + plan.md |
| 2026-02-14 | 设计评审 | Banner 视觉稿（如需要） |
| 2026-02-15 | Phase 1 开发 | 基础功能完成 |
| 2026-02-16 | Phase 2 开发 | 埋点完成 |
| 2026-02-17 | Phase 3 测试 | 测试通过 |
| 2026-02-18 | 预发布验证 | 预发布环境验证 |
| 2026-02-19 | 正式发布 | v1.5.6 上线 |
| 2026-02-19 ~ 03-04 | 数据收集 | 2 周数据 |
| 2026-03-05 | 复盘 | 数据分析 + 下一步规划 |

---

## 四、风险评估

### 4.1 技术风险

| 风险 | 影响 | 概率 | 应对方案 |
|------|------|------|----------|
| Banner 自动淡出与用户交互冲突 | 中 | 低 | 用户 hover 时暂停淡出计时器 |
| 埋点数据量过大影响性能 | 低 | 低 | 使用防抖/节流，批量上报 |
| localStorage 被禁用导致 Banner 重复显示 | 低 | 中 | try-catch 包裹，降级为 sessionStorage |
| 移动端 Banner 误显示 | 中 | 低 | 严格检查 deviceKind，增加测试用例 |

---

### 4.2 产品风险

| 风险 | 影响 | 概率 | 应对方案 |
|------|------|------|----------|
| Banner 被用户认为是广告，直接关闭 | 高 | 中 | 文案强调"新功能"，视觉避免广告感 |
| 实践案例数量不足，用户失望 | 高 | 中 | 优先补充热门 Skill 的实践案例 |
| 文案"看案例"/"找工具"不够清晰 | 中 | 低 | 上线后收集用户反馈，快速迭代 |
| 埋点数据不准确，无法验证效果 | 高 | 低 | 开发阶段充分测试埋点逻辑 |

---

### 4.3 时间风险

| 风险 | 影响 | 概率 | 应对方案 |
|------|------|------|----------|
| 设计评审延期 | 低 | 低 | Banner 使用现有设计系统，无需新设计 |
| 开发任务超时 | 中 | 低 | 任务拆解细致，每日同步进度 |
| 测试发现重大 bug | 高 | 低 | 预留 1 天 buffer，必要时延期发布 |

---

## 五、验收清单

### 5.1 功能验收

- [ ] 首次访问首页显示引导 Banner（桌面端）
- [ ] Banner 内容正确："发现新功能：实践模式"
- [ ] 点击"立即体验"切换到实践模式并关闭 Banner
- [ ] 点击 [✕] 关闭 Banner，localStorage 记录成功
- [ ] Banner 3 秒后自动淡出
- [ ] 移动端不显示 Banner
- [ ] ModeDock 文案更新为"看案例"/"找工具"
- [ ] 实践模式首屏显示价值主张文案
- [ ] 实践案例 < 6 个时显示引导卡片

---

### 5.2 埋点验证

- [ ] 模式切换事件正常上报
- [ ] Banner 展示事件正常上报
- [ ] Banner 点击事件正常上报
- [ ] 实践卡片点击事件正常上报
- [ ] 页面停留时长事件正常上报
- [ ] Analytics 后台可以看到事件数据
- [ ] 事件属性（properties）正确

---

### 5.3 性能验证

- [ ] Banner 动画流畅（60fps）
- [ ] 埋点不影响页面性能（< 10ms）
- [ ] localStorage 读写不阻塞渲染
- [ ] 移动端性能正常

---

### 5.4 兼容性验证

- [ ] Chrome 最新版正常
- [ ] Safari 最新版正常
- [ ] Firefox 最新版正常
- [ ] 移动端 Safari 正常
- [ ] 移动端 Chrome 正常

---

## 六、上线后监控

### 6.1 关键指标

| 指标 | 监控方式 | 告警阈值 |
|------|----------|----------|
| 实践模式发现率 | Analytics 后台 | < 20%（需优化） |
| Banner 转化率 | Analytics 后台 | < 20%（需优化） |
| 页面错误率 | Vercel 监控 | > 1%（需修复） |
| 页面加载时间 | Vercel Speed Insights | > 3s（需优化） |

---

### 6.2 数据收集计划

**第 1 周**（2026-02-19 ~ 02-25）：
- 每日查看埋点数据，确保数据正常
- 收集用户反馈（如有）
- 如发现严重问题，立即修复

**第 2 周**（2026-02-26 ~ 03-04）：
- 继续收集数据
- 分析用户行为模式
- 准备复盘报告

**复盘**（2026-03-05）：
- 数据分析：实践模式发现率、使用率、停留时长等
- 用户反馈总结
- 下一步优化方向：
  - 如果发现率 > 40%，考虑改默认模式
  - 如果发现率 < 20%，考虑调整 ModeDock 位置或增强引导
  - 如果使用率低，考虑优化实践案例质量

---

## 七、回滚方案

如果上线后发现严重问题，可以快速回滚：

1. **Banner 问题**：
   - 通过 localStorage key 禁用 Banner（不需要重新部署）
   - 或者通过环境变量控制 Banner 显示

2. **埋点问题**：
   - 埋点失败不影响功能，可以后续修复

3. **文案问题**：
   - 快速修改文案，重新部署（< 5 分钟）

4. **完全回滚**：
   - 回滚到 v1.5.5（Vercel 一键回滚）

---

## 八、后续迭代方向

根据 v1.5.6 的数据反馈，v1.6+ 可能的优化方向：

1. **如果实践模式发现率高、使用率高**：
   - 考虑改首页默认模式为实践模式
   - 增加实践案例投稿功能（需要 v1.6.0 登录体系）
   - 优化实践案例详情页（或考虑站内承载）

2. **如果实践模式发现率低**：
   - 调整 ModeDock 位置（左侧或顶部 Tab）
   - 增强首次引导（视频教程、交互式引导等）
   - 在 Skills 模式中增加"查看相关案例"入口

3. **如果实践模式使用率低**：
   - 优化实践案例质量（更多优质案例）
   - 优化实践卡片设计（更吸引人）
   - 增加实践案例的筛选和排序功能

---

**规划完成，等待评审 🚀**
