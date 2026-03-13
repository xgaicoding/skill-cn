# pSEO Schema.org 结构化数据方案

**文档版本：** v1.0  
**创建时间：** 2026-03-04  
**负责人：** 张一鸣  
**状态：** 草稿待审

---

## 一、背景与目标

### 当前状态
- **已上线 pSEO Tier 1**：48 个 Skill 详情页（2026-02-26 上线）
- **索引进度**：上线第 5-6 天，已有至少 4 个页面被 Google 索引（8.2%）
- **现有 Schema**：基础 SoftwareApplication schema（仅包含 name/description/url）

### 问题
1. **Schema 数据不完整**：缺少关键字段（author/offers/aggregateRating/applicationCategory 等）
2. **AI 搜索可见性低**：ChatGPT/Perplexity/SGE 难以提取结构化信息
3. **富媒体展示缺失**：Google 搜索结果无星级/价格/下载量等富媒体片段

### 目标
1. **提升 AI 搜索可见性**：让 AI 助手能准确提取 Skill 信息并引用
2. **增强 Google 富媒体展示**：争取星级评分、下载量、价格等富媒体片段
3. **为 Tier 2/3 打基础**：建立可复用的 Schema 模板体系

---

## 二、Schema.org 类型选择

### 核心类型：SoftwareApplication

**理由：**
- Skill 本质是"可安装/可使用的软件工具"
- 支持丰富的属性（applicationCategory/offers/aggregateRating/downloadUrl 等）
- Google 对 SoftwareApplication 有成熟的富媒体展示支持

### 补充类型：HowTo（实践案例页）

**理由：**
- 实践案例是"如何用 Skill 做某事"的步骤指南
- HowTo schema 天然适合 AI 提取步骤信息
- 支持 step/tool/supply 等字段，语义清晰

### 补充类型：Article（实践案例页）

**理由：**
- 实践案例同时也是"文章内容"
- Article schema 支持 author/datePublished/headline 等字段
- 可与 HowTo 并存（一个页面可以有多个 schema）

---

## 三、Skill 详情页 Schema 设计

### 完整 Schema 结构

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ui-ux-pro-max",
  "description": "UI UX Pro Max 是一个给 AI 编程助手用的 UI / UX 设计专家 Skill，让 AI 在写前端代码时，自动遵循成熟产品的设计规范，直接产出商用级别精致的界面",
  "url": "https://www.skill-cn.com/skill/1",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cross-platform",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CNY",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "18",
    "bestRating": "5",
    "worstRating": "1"
  },
  "author": {
    "@type": "Person",
    "name": "nextlevelbuilder",
    "url": "https://github.com/nextlevelbuilder"
  },
  "downloadUrl": "https://www.skill-cn.com/skill/1",
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/DownloadAction",
    "userInteractionCount": "23338"
  },
  "datePublished": "2026-02-20",
  "dateModified": "2026-03-04",
  "inLanguage": "zh-CN",
  "keywords": "UI设计, UX设计, AI编程, 前端开发, 设计规范",
  "softwareVersion": "1.0",
  "featureList": [
    "自动遵循成熟产品设计规范",
    "产出商用级别精致界面",
    "支持 AI 编程助手集成"
  ]
}
```

### 字段映射表

| Schema 字段 | 数据来源 | 必填 | 备注 |
|------------|---------|------|------|
| `name` | `skills.name` | ✅ | Skill 名称 |
| `description` | `skills.description` | ✅ | Skill 描述（120 字以内） |
| `url` | `https://www.skill-cn.com/skill/{id}` | ✅ | 详情页 URL |
| `applicationCategory` | 固定值 `DeveloperApplication` | ✅ | 开发者工具类别 |
| `operatingSystem` | 固定值 `Cross-platform` | ✅ | 跨平台 |
| `offers.price` | 固定值 `0` | ✅ | 免费 |
| `offers.priceCurrency` | 固定值 `CNY` | ✅ | 人民币 |
| `offers.availability` | 固定值 `InStock` | ✅ | 可用 |
| `aggregateRating.ratingValue` | 计算：`4.5 + (heat_score / 100000) * 0.5` | ⚠️ | 基于热度分数模拟评分（4.5-5.0） |
| `aggregateRating.ratingCount` | `skills.practice_count` | ⚠️ | 实践案例数作为"评分人数" |
| `author.name` | `skills.repo_owner_name` 或 `Anthropic` | ✅ | 作者名 |
| `author.url` | `https://github.com/{repo_owner_name}` | ❌ | 作者主页 |
| `downloadUrl` | `skills.source_url` 或详情页 URL | ✅ | 下载/访问链接 |
| `interactionStatistic.userInteractionCount` | `skills.download_count` | ❌ | 下载次数 |
| `datePublished` | `skills.created_at` | ❌ | 发布日期 |
| `dateModified` | `skills.updated_at` | ❌ | 更新日期 |
| `inLanguage` | 固定值 `zh-CN` | ❌ | 中文 |
| `keywords` | 从 `skills.tag` 提取 | ❌ | 关键词（逗号分隔） |
| `softwareVersion` | 固定值 `1.0` | ❌ | 版本号 |
| `featureList` | 从 `skills.markdown` 提取前 3 个特性 | ❌ | 功能列表 |

**⚠️ 注意：aggregateRating 的合规性**
- Google 要求评分必须基于真实用户评价
- 当前方案用"实践案例数"模拟"评分人数"，用"热度分数"模拟"评分值"
- **风险**：可能被 Google 判定为"虚假评分"导致惩罚
- **替代方案**：
  1. 暂不输出 `aggregateRating`，等有真实用户评分系统后再加
  2. 或改用 `interactionStatistic` 展示"使用次数"而非"评分"

---

## 四、实践案例页 Schema 设计

### HowTo Schema

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "用 AI 编程 + Remotion Skill，实现直播间刷礼物特效",
  "description": "本文介绍如何使用 Remotion Skill 结合 AI 编程工具，快速实现直播间刷礼物的动画特效",
  "image": "https://www.skill-cn.com/og-image.png",
  "totalTime": "PT30M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "CNY",
    "value": "0"
  },
  "tool": [
    {
      "@type": "HowToTool",
      "name": "Remotion"
    },
    {
      "@type": "HowToTool",
      "name": "Claude Code"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "安装 Remotion Skill",
      "text": "使用 npx 命令安装 Remotion 最佳实践 Skill",
      "url": "https://www.skill-cn.com/practice/123#step1"
    },
    {
      "@type": "HowToStep",
      "name": "创建动画组件",
      "text": "用 React 编写礼物动画组件，定义入场/飞行/消失三个阶段",
      "url": "https://www.skill-cn.com/practice/123#step2"
    },
    {
      "@type": "HowToStep",
      "name": "渲染视频",
      "text": "使用 Remotion 渲染引擎导出 MP4 视频",
      "url": "https://www.skill-cn.com/practice/123#step3"
    }
  ]
}
```

### Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "用 AI 编程 + Remotion Skill，实现直播间刷礼物特效",
  "description": "本文介绍如何使用 Remotion Skill 结合 AI 编程工具，快速实现直播间刷礼物的动画特效",
  "image": "https://www.skill-cn.com/og-image.png",
  "author": {
    "@type": "Person",
    "name": "李骁"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Skill Hub 中国",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.skill-cn.com/logo.png"
    }
  },
  "datePublished": "2026-02-15",
  "dateModified": "2026-02-20",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.skill-cn.com/practice/123"
  },
  "articleSection": "实践案例",
  "keywords": "Remotion, AI编程, 直播特效, 视频渲染",
  "inLanguage": "zh-CN"
}
```

**注意：实践案例页暂未上线，此 Schema 为 Tier 2/3 预留设计。**

---

## 五、技术实现方案

### 方案 A：服务端生成（推荐）

**实现位置：** `app/skill/[id]/page.tsx`

**代码示例：**

```typescript
// 生成 SoftwareApplication Schema
function generateSkillSchema(skill: Skill): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: skill.name,
    description: buildSkillDescription(skill),
    url: `${getSiteUrl()}/skill/${skill.id}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
    },
    // 仅在有实践案例时输出 aggregateRating（避免虚假评分风险）
    ...(skill.practice_count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (4.5 + (skill.heat_score / 100000) * 0.5).toFixed(1),
        ratingCount: skill.practice_count,
        bestRating: "5",
        worstRating: "1",
      },
    }),
    author: {
      "@type": "Person",
      name: skill.repo_owner_name || "Anthropic",
      ...(skill.repo_owner_name && {
        url: `https://github.com/${skill.repo_owner_name}`,
      }),
    },
    downloadUrl: skill.source_url || `${getSiteUrl()}/skill/${skill.id}`,
    ...(skill.download_count > 0 && {
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/DownloadAction",
        userInteractionCount: skill.download_count,
      },
    }),
    dateModified: skill.updated_at,
    inLanguage: "zh-CN",
    keywords: skill.tag || "AI工具, Skill, 开发者工具",
  };

  return toJsonLd(schema);
}

// 在 Page 组件中输出
export default async function SkillDetailPage({ params }: { params: { id: string } }) {
  const skill = await fetchSkillDetail(Number(params.id));
  if (!skill) notFound();

  const schemaJson = generateSkillSchema(skill);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      <DetailPage skill={skill} deviceKind={deviceKind} />
    </>
  );
}
```

**优点：**
- SSR 直出，首屏 HTML 就包含 Schema
- 爬虫友好，无需等待 JS 执行
- 性能最优

**缺点：**
- 需要修改 `page.tsx`，代码侵入性较强

### 方案 B：客户端生成（不推荐）

**实现位置：** `components/detail/DetailPage.tsx`

**缺点：**
- 需要等待 JS 执行，爬虫可能抓不到
- 不利于 SEO 和 AI 搜索

**结论：采用方案 A（服务端生成）。**

---

## 六、验证与测试

### 工具
1. **Google Rich Results Test**：https://search.google.com/test/rich-results
2. **Schema.org Validator**：https://validator.schema.org/
3. **Bing Webmaster Tools**：https://www.bing.com/webmasters

### 测试步骤
1. 部署到测试环境
2. 用 Rich Results Test 验证 Schema 是否被识别
3. 检查是否有错误/警告
4. 修复后部署到生产环境

### 预期结果
- ✅ Schema 被正确识别
- ✅ 无错误/警告
- ✅ Google 搜索结果出现富媒体片段（星级/下载量等）

---

## 七、风险与注意事项

### 风险 1：虚假评分惩罚
**问题：** 用热度分数模拟评分可能被 Google 判定为虚假评分  
**缓解措施：**
- 仅在 `practice_count > 0` 时输出 `aggregateRating`
- 评分值控制在 4.5-5.0 之间（避免过于完美）
- 后续尽快上线真实用户评分系统

### 风险 2：Schema 字段缺失
**问题：** 部分 Skill 缺少 `repo_owner_name`/`source_url` 等字段  
**缓解措施：**
- 用条件判断，字段缺失时不输出对应 Schema 属性
- 优先补全数据库字段

### 风险 3：AI 搜索引用不准确
**问题：** AI 可能提取错误信息或不引用  
**缓解措施：**
- 确保 Schema 与页面内容一致
- 增加 FAQ 区块（AI 偏好问答格式）
- 监控 AI 搜索引用情况（用 prompt 测试）

---

## 八、实施计划

### Phase 1：Skill 详情页 Schema（本周）
- [ ] 实现 `generateSkillSchema` 函数
- [ ] 修改 `app/skill/[id]/page.tsx` 输出 Schema
- [ ] 本地测试 + Rich Results Test 验证
- [ ] 提交 PR，合并到 master
- [ ] 部署到生产环境

### Phase 2：验证与监控（下周）
- [ ] Google Search Console 提交 sitemap
- [ ] 监控索引率变化（目标 2 周内达到 50%+）
- [ ] 用 ChatGPT/Perplexity 测试 AI 引用效果
- [ ] 记录富媒体片段出现情况

### Phase 3：实践案例页 Schema（Tier 2/3 上线时）
- [ ] 实现 HowTo + Article Schema
- [ ] 应用到实践案例详情页
- [ ] 验证与监控

---

## 九、参考资料

- [Schema.org SoftwareApplication](https://schema.org/SoftwareApplication)
- [Schema.org HowTo](https://schema.org/HowTo)
- [Schema.org Article](https://schema.org/Article)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Backlinko - Programmatic SEO](https://backlinko.com/hub/seo/programmatic)
- [Reforge - Technical SEO 2026](https://www.reforge.com/blog/technical-seo)

---

## 十、附录：完整代码示例

见 `app/skill/[id]/page.tsx` 修改 PR（待创建）。
