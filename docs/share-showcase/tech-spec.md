# 分享成果功能 - 技术方案

## 目标

闭环 Growth Loop：用户看案例 → 用工具做项目 → **分享成果到 skill-cn** → 吸引新用户 → 看案例

## MVP 范围

### 核心功能
1. **用户提交成果**：在实践案例详情页底部，用户可以提交自己的项目
2. **成果展示**：在实践案例详情页展示"用这个案例做出来的项目"
3. **激励机制**：被展示的项目获得曝光（GitHub repo 链接 + 描述）

### 不做的事（v1）
- ❌ 复杂的审核流程（先自动上线，后台可手动下线）
- ❌ 用户个人主页
- ❌ 点赞、评论、排序
- ❌ 图片上传（只要 GitHub repo 链接）

## 数据库设计

### 新表：practice_showcases

```sql
create table if not exists public.practice_showcases (
  id serial primary key,
  practice_id integer not null,
  user_id uuid null, -- 关联 auth.users（可选，未登录用户可以匿名提交）
  github_repo_url text not null, -- GitHub repo 链接（必填）
  description text not null, -- 项目描述（100字以内）
  author_name text null, -- 作者名（未登录用户手动填写）
  author_github_username text null, -- GitHub 用户名（从 repo URL 提取）
  is_listed boolean not null default true, -- 是否展示（后台可手动下线）
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  
  constraint practice_showcases_practice_id_fkey 
    foreign key (practice_id) references public.practices (id) on delete cascade,
  constraint practice_showcases_user_id_fkey 
    foreign key (user_id) references auth.users (id) on delete set null
);

-- 索引
create index idx_practice_showcases_practice_id 
  on public.practice_showcases (practice_id, is_listed, created_at desc);

create index idx_practice_showcases_user_id 
  on public.practice_showcases (user_id);
```

### 字段说明
- `github_repo_url`：必填，格式验证（https://github.com/xxx/xxx）
- `description`：必填，100字以内
- `author_name`：未登录用户手动填写，登录用户自动从 GitHub 获取
- `author_github_username`：从 repo URL 提取（用于展示头像）
- `is_listed`：默认 true，后台可手动下线垃圾内容

## API 设计

### 1. 提交成果

**POST** `/api/practices/[id]/showcases`

**Request Body:**
```json
{
  "github_repo_url": "https://github.com/username/repo",
  "description": "用这个案例做了一个 xxx 项目",
  "author_name": "张三" // 未登录用户必填
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "practice_id": 123,
    "github_repo_url": "https://github.com/username/repo",
    "description": "用这个案例做了一个 xxx 项目",
    "author_name": "张三",
    "author_github_username": "username",
    "created_at": "2026-02-13T12:00:00Z"
  }
}
```

**验证规则：**
- `github_repo_url`：必须是有效的 GitHub repo URL
- `description`：1-100 字
- `author_name`：未登录用户必填，1-20 字

### 2. 获取成果列表

**GET** `/api/practices/[id]/showcases`

**Query Params:**
- `page`：页码（默认 1）
- `size`：每页数量（默认 10，最大 20）

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "github_repo_url": "https://github.com/username/repo",
      "description": "用这个案例做了一个 xxx 项目",
      "author_name": "张三",
      "author_github_username": "username",
      "created_at": "2026-02-13T12:00:00Z"
    }
  ],
  "page": 1,
  "size": 10,
  "total": 25,
  "totalPages": 3
}
```

## UI 设计

### 1. 实践案例详情页（新增部分）

在现有详情页底部新增两个部分：

#### A. 提交成果表单
```
┌─────────────────────────────────────────┐
│ 💡 用这个案例做了项目？分享给大家吧！      │
│                                         │
│ GitHub Repo URL *                       │
│ ┌─────────────────────────────────────┐ │
│ │ https://github.com/username/repo    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 项目描述 * (100字以内)                   │
│ ┌─────────────────────────────────────┐ │
│ │ 用这个案例做了一个...                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 你的名字 * (未登录用户需填写)             │
│ ┌─────────────────────────────────────┐ │
│ │ 张三                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ 提交分享 ]                            │
└─────────────────────────────────────────┘
```

#### B. 成果展示列表
```
┌─────────────────────────────────────────┐
│ 🚀 用这个案例做出来的项目 (25)           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 张三 (@username)                  │ │
│ │ 📦 github.com/username/repo          │ │
│ │ 用这个案例做了一个 xxx 项目...        │ │
│ │ 🕐 2天前                             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 李四 (@lisi)                      │ │
│ │ 📦 github.com/lisi/awesome-project   │ │
│ │ 基于这个案例实现了...                 │ │
│ │ 🕐 5天前                             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ 加载更多 ]                            │
└─────────────────────────────────────────┘
```

### 2. 组件结构

```
app/practice/[id]/page.tsx (新增)
  └── components/practice/
      ├── PracticeDetail.tsx (详情展示)
      ├── PracticeShowcaseForm.tsx (提交表单)
      └── PracticeShowcaseList.tsx (成果列表)
          └── PracticeShowcaseCard.tsx (单个成果卡片)
```

## 实现步骤

### Phase 1: 数据库 + API (1天)
1. ✅ 创建 `practice_showcases` 表
2. ✅ 实现 POST `/api/practices/[id]/showcases`
3. ✅ 实现 GET `/api/practices/[id]/showcases`
4. ✅ 添加 URL 验证和字段验证

### Phase 2: UI 组件 (1天)
1. ✅ 创建 `PracticeShowcaseForm` 组件
2. ✅ 创建 `PracticeShowcaseList` 组件
3. ✅ 创建 `PracticeShowcaseCard` 组件
4. ✅ 集成到实践案例详情页

### Phase 3: 测试 + 上线 (0.5天)
1. ✅ 本地测试提交流程
2. ✅ 测试分页加载
3. ✅ 部署到生产环境

## 数据分析

### 新增埋点事件

```typescript
// lib/analytics.ts 新增
export const trackShowcaseSubmit = (practiceId: number, showcaseId: number) => {
  trackEvent('showcase_submit', {
    practice_id: practiceId,
    showcase_id: showcaseId,
  });
};

export const trackShowcaseView = (practiceId: number) => {
  trackEvent('showcase_view', {
    practice_id: practiceId,
  });
};

export const trackShowcaseClick = (showcaseId: number, repoUrl: string) => {
  trackEvent('showcase_click', {
    showcase_id: showcaseId,
    repo_url: repoUrl,
  });
};
```

### 关键指标

1. **提交率**：查看实践案例的用户中，多少人提交了成果？
2. **成果点击率**：展示的成果中，多少被点击查看？
3. **回流率**：提交成果的用户中，多少人再次回访 skill-cn？

## Growth Loop 验证

### 假设
- 用户看到别人的成果 → 激发自己动手的欲望
- 用户提交成果 → 获得曝光 → 吸引新用户
- 成果展示 → 提升实践案例的可信度和吸引力

### 验证指标（2周后）
- 提交率 >5%：说明用户有分享意愿
- 成果点击率 >20%：说明成果有吸引力
- 回流率 >30%：说明 loop 开始闭环

## 风险与应对

### 风险1：垃圾内容
**应对：**
- 后台可手动下线（`is_listed = false`）
- 未来可加入简单的关键词过滤

### 风险2：提交率低
**应对：**
- 优化文案，强调"获得曝光"的价值
- 在成果列表顶部展示优质案例，激发用户

### 风险3：GitHub repo 失效
**应对：**
- 定期检查 repo 是否存在（后台任务）
- 失效的自动下线或标记

## 下一步优化（v2）

1. **审核机制**：人工审核 + 自动过滤
2. **排序优化**：按 repo stars、最新、最热排序
3. **用户个人主页**：展示用户提交的所有成果
4. **点赞功能**：让优质成果浮到顶部
5. **图片展示**：支持上传项目截图

---

**预计工作量：2.5 天**
**目标上线时间：v1.5.6 上线后 1 周内**
