# v1.5.6 技术实施方案

> 版本：1.5.6 | 日期：2026-02-13 | 负责人：TBD

---

## 一、技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React Components                                 │  │
│  │  - PracticeDiscoveryBanner                       │  │
│  │  - ModeDock (文案优化)                           │  │
│  │  - HomePage (价值主张)                           │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Analytics Layer (lib/analytics.ts)              │  │
│  │  - trackEvent()                                   │  │
│  │  - getSessionId()                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Supabase Client                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  analytics_events 表                              │  │
│  │  - event_name, properties, session_id, ...       │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  分析视图                                         │  │
│  │  - analytics_daily_stats                         │  │
│  │  - analytics_practice_discovery                  │  │
│  │  - analytics_banner_conversion                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 二、核心模块设计

### 2.1 埋点系统 (lib/analytics.ts)

**职责**：
- 封装埋点逻辑，统一事件上报接口
- 生成和管理 session_id
- 收集页面和设备信息
- 错误处理（埋点失败不影响功能）

**接口设计**：
```typescript
// 基础埋点函数
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): Promise<void>

// 防抖版本（用于高频事件）
export const trackEventDebounced: typeof trackEvent

// 获取 session_id
function getSessionId(): string

// 获取设备类型
function getDeviceType(): 'desktop' | 'mobile' | 'tablet'
```

**实现要点**：
- session_id 存储在 sessionStorage（浏览器会话级别）
- 自动收集 page_url, referrer, user_agent, device_type
- try-catch 包裹，埋点失败静默处理
- 支持防抖（避免高频事件刷爆数据库）

---

### 2.2 首页引导 Banner (components/home/PracticeDiscoveryBanner.tsx)

**职责**：
- 首次访问时显示引导 Banner
- 3 秒后自动淡出
- 支持手动关闭
- 记录到 localStorage，不再显示

**Props 设计**：
```typescript
interface PracticeDiscoveryBannerProps {
  onTryNow: () => void;  // 点击"立即体验"回调
  onClose: () => void;   // 点击关闭回调
}
```

**状态管理**：
```typescript
const [visible, setVisible] = useState(true);
const [shouldRender, setShouldRender] = useState(true);
```

**生命周期**：
1. 组件挂载：检查 localStorage，如果已关闭则不渲染
2. 显示 Banner：触发 `banner_show` 埋点
3. 3 秒后：自动淡出（opacity: 0）
4. 淡出动画结束：卸载组件（display: none）
5. 用户点击关闭：记录到 localStorage，卸载组件

**localStorage key**：
```typescript
const BANNER_SEEN_KEY = 'skillhub_practice_banner_seen_v1';
```

---

### 2.3 ModeDock 文案优化 (components/home/ModeDock.tsx)

**改动点**：
1. 文案修改：
   - "实践模式" → "看案例"
   - "Skill 模式" → "找工具"

2. aria-label 同步更新：
   - "切换到实践模式" → "切换到看案例"
   - "切换到刷 Skill" → "切换到找工具"

3. 埋点集成：
   - 在 `onChange` 回调中添加 `trackEvent('mode_switch', { from, to })`

**改动文件**：
- `components/home/ModeDock.tsx`（约 10 行代码）

---

### 2.4 实践模式价值主张 (components/home/HomePage.tsx)

**新增组件**：

1. **价值主张文案**（实践模式首屏顶部）：
```tsx
{mode === 'practices' && (
  <div className="practice-mode-header">
    <p className="practice-mode-tagline">
      💡 真实案例 · 实战方案 · 快速上手
    </p>
  </div>
)}
```

2. **空状态引导**（实践案例 < 6 个时）：
```tsx
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

**样式设计**：
- `.practice-mode-header`：居中，灰色文字，小字号
- `.practice-empty-guide`：卡片样式，居中，引导性文案

---

## 三、埋点事件清单

### 3.1 事件定义

| 事件名 | 触发时机 | Properties | 位置 |
|--------|----------|------------|------|
| `banner_show` | Banner 显示 | `{ type: 'practice_discovery' }` | PracticeDiscoveryBanner.tsx |
| `banner_click` | 点击"立即体验" | `{ type: 'practice_discovery', action: 'try_now' }` | PracticeDiscoveryBanner.tsx |
| `banner_close` | 点击关闭按钮 | `{ type: 'practice_discovery', action: 'close' }` | PracticeDiscoveryBanner.tsx |
| `mode_switch` | 切换模式 | `{ from: 'skills', to: 'practices' }` | ModeDock.tsx |
| `practice_card_click` | 点击实践卡片 | `{ practice_id: 123, action: 'view_original' }` | PracticeFeedCard.tsx |
| `page_view_duration` | 页面卸载 | `{ mode: 'practices', duration_seconds: 45 }` | HomePage.tsx |

### 3.2 埋点位置

**PracticeDiscoveryBanner.tsx**：
```tsx
useEffect(() => {
  trackEvent('banner_show', { type: 'practice_discovery' });
}, []);

const handleTryNow = () => {
  trackEvent('banner_click', { 
    type: 'practice_discovery', 
    action: 'try_now' 
  });
  onTryNow();
};

const handleClose = () => {
  trackEvent('banner_close', { 
    type: 'practice_discovery', 
    action: 'close' 
  });
  onClose();
};
```

**ModeDock.tsx**：
```tsx
onClick={() => {
  trackEvent('mode_switch', {
    from: mode,
    to: 'practices'
  });
  onChange('practices');
}}
```

**PracticeFeedCard.tsx**：
```tsx
onClick={() => {
  trackEvent('practice_card_click', {
    practice_id: practice.id,
    action: 'view_original'
  });
  trackClick(); // 现有的点击统计
}}
```

**HomePage.tsx**：
```tsx
useEffect(() => {
  const startTime = Date.now();
  return () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    if (duration > 3) { // 只记录停留 > 3 秒的
      trackEvent('page_view_duration', {
        mode,
        duration_seconds: duration
      });
    }
  };
}, [mode]);
```

---

## 四、文件清单

### 4.1 新增文件

| 文件路径 | 说明 | 代码量 |
|---------|------|--------|
| `lib/analytics.ts` | 埋点系统核心逻辑 | ~100 行 |
| `components/home/PracticeDiscoveryBanner.tsx` | 引导 Banner 组件 | ~150 行 |
| `components/home/PracticeDiscoveryBanner.module.css` | Banner 样式 | ~80 行 |
| `docs/1.5.6_practice-discovery/analytics_schema.sql` | 数据库 Schema | ~150 行 |

### 4.2 修改文件

| 文件路径 | 改动说明 | 代码量 |
|---------|----------|--------|
| `components/home/ModeDock.tsx` | 文案优化 + 埋点 | ~10 行 |
| `components/home/HomePage.tsx` | 集成 Banner + 价值主张 + 埋点 | ~50 行 |
| `components/home/PracticeFeedCard.tsx` | 添加埋点 | ~5 行 |

**总代码量**：~545 行（含注释和样式）

---

## 五、开发步骤

### Step 1：数据库准备（骁哥手动执行）

1. 在 Supabase Dashboard 执行 `analytics_schema.sql`
2. 验证表和索引创建成功
3. 修改 RLS 策略中的管理员邮箱

### Step 2：埋点系统开发

1. 创建 `lib/analytics.ts`
2. 实现 `trackEvent()` 函数
3. 实现 `getSessionId()` 和 `getDeviceType()`
4. 单元测试（可选）

### Step 3：Banner 组件开发

1. 创建 `PracticeDiscoveryBanner.tsx`
2. 实现显示/隐藏逻辑
3. 实现自动淡出逻辑
4. 集成埋点
5. 编写样式

### Step 4：ModeDock 文案优化

1. 修改文案
2. 修改 aria-label
3. 集成埋点

### Step 5：HomePage 集成

1. 集成 Banner 组件
2. 添加价值主张文案
3. 添加空状态引导
4. 集成页面停留时长埋点

### Step 6：PracticeFeedCard 埋点

1. 在"跳转原文"按钮添加埋点

### Step 7：测试

1. 功能测试（桌面端 + 移动端）
2. 埋点测试（验证数据写入）
3. 性能测试（GPU/内存）
4. 兼容性测试

---

## 六、测试清单

### 6.1 功能测试

**Banner 测试**：
- [ ] 首次访问显示 Banner
- [ ] 3 秒后自动淡出
- [ ] 点击"立即体验"切换到实践模式并关闭 Banner
- [ ] 点击关闭按钮关闭 Banner
- [ ] 关闭后刷新页面不再显示
- [ ] 移动端不显示 Banner

**ModeDock 测试**：
- [ ] 文案显示为"看案例"/"找工具"
- [ ] 点击切换模式正常
- [ ] aria-label 正确

**价值主张测试**：
- [ ] 实践模式首屏显示价值主张文案
- [ ] 实践案例 < 6 个时显示引导卡片
- [ ] 实践案例 >= 6 个时不显示引导卡片

### 6.2 埋点测试

**验证方法**：
1. 在 Supabase Dashboard 打开 `analytics_events` 表
2. 执行操作（切换模式、点击 Banner 等）
3. 刷新表，查看是否有新记录

**测试用例**：
- [ ] `banner_show` 事件正常记录
- [ ] `banner_click` 事件正常记录
- [ ] `banner_close` 事件正常记录
- [ ] `mode_switch` 事件正常记录
- [ ] `practice_card_click` 事件正常记录
- [ ] `page_view_duration` 事件正常记录
- [ ] properties 字段正确
- [ ] session_id 正确
- [ ] page_url 正确
- [ ] device_type 正确

### 6.3 性能测试

- [ ] Banner 动画流畅（60fps）
- [ ] 埋点不阻塞渲染（< 10ms）
- [ ] localStorage 读写不影响性能
- [ ] 页面加载时间无明显增加

---

## 七、数据分析

### 7.1 常用查询

**实践模式发现率**：
```sql
SELECT * FROM analytics_practice_discovery;
```

**Banner 转化率**：
```sql
SELECT * FROM analytics_banner_conversion;
```

**每日事件统计**：
```sql
SELECT * FROM analytics_daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

**实践模式平均停留时长**：
```sql
SELECT 
  AVG((properties->>'duration_seconds')::int) AS avg_duration_seconds
FROM analytics_events
WHERE event_name = 'page_view_duration'
  AND properties->>'mode' = 'practices'
  AND created_at >= NOW() - INTERVAL '7 days';
```

**模式切换漏斗**：
```sql
SELECT 
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT session_id) FILTER (
    WHERE event_name = 'mode_switch'
  ) AS switched_sessions,
  COUNT(DISTINCT session_id) FILTER (
    WHERE event_name = 'practice_card_click'
  ) AS clicked_sessions
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### 7.2 数据导出

**导出为 CSV**（Supabase Dashboard）：
1. 执行查询
2. 点击"Download CSV"

**或使用代码**：
```typescript
const { data } = await supabase
  .from('analytics_events')
  .select('*')
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .csv();
```

---

## 八、上线检查清单

### 8.1 上线前

- [ ] 数据库表创建成功
- [ ] RLS 策略配置正确
- [ ] 管理员邮箱已更新
- [ ] 所有功能测试通过
- [ ] 所有埋点测试通过
- [ ] 性能测试通过
- [ ] 代码审查通过
- [ ] 预发布环境验证通过

### 8.2 上线后

- [ ] 监控埋点数据是否正常写入
- [ ] 监控页面错误率
- [ ] 监控页面加载时间
- [ ] 收集用户反馈

---

## 九、回滚方案

如果上线后发现严重问题：

1. **Banner 问题**：
   - 通过环境变量禁用 Banner（不需要重新部署）
   - 或者修改 localStorage key（让所有用户重新看到）

2. **埋点问题**：
   - 埋点失败不影响功能，可以后续修复
   - 如果数据库压力过大，可以临时禁用埋点

3. **完全回滚**：
   - Vercel 一键回滚到 v1.5.5

---

## 十、后续优化

根据数据反馈，可能的优化方向：

1. **如果发现率低**：
   - 调整 Banner 样式（更显眼）
   - 增加引导动画
   - 调整 ModeDock 位置

2. **如果转化率低**：
   - 优化 Banner 文案
   - 增加视频教程
   - 增加交互式引导

3. **如果使用率低**：
   - 优化实践案例质量
   - 增加实践案例数量
   - 优化实践卡片设计

---

**技术方案完成，准备 codex 审查 🚀**
