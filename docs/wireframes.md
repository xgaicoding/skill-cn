# SkillCN（MVP）交互线稿（Wireframes）

基于 `docs/requirements.md` 的页面与交互口径，采用 **SVG 线稿**表达（Desktop 优先，含关键状态与核心流程）。

## 0. 视觉图例（Legend）

<svg width="960" height="140" viewBox="0 0 960 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Legend">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .muted { fill: #666; }
  </style>
  <rect class="box" x="20" y="20" width="220" height="40"/>
  <text class="txt" x="30" y="46">实体容器 / 区块</text>

  <rect class="dash" x="260" y="20" width="220" height="40"/>
  <text class="txt" x="270" y="46">可选 / 状态容器</text>

  <rect class="box" x="500" y="20" width="180" height="40"/>
  <text class="txt" x="510" y="46">按钮</text>
  <line class="box" x1="690" y1="20" x2="930" y2="60"/>
  <text class="txt" x="700" y="46">线 = 分割/关联</text>

  <text class="txt muted" x="20" y="105">注：线稿以“布局与信息架构”为主；样式由研发/设计稿确定。</text>
</svg>

---

## 1. 全局：Header（未登录 / 已登录）

<svg width="1200" height="220" viewBox="0 0 1200 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Global Header states">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
  </style>

  <!-- Header container -->
  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <!-- Logo -->
  <rect class="box" x="40" y="45" width="120" height="30"/>
  <text class="txt" x="55" y="65">Logo</text>

  <!-- Search -->
  <rect class="box" x="190" y="45" width="520" height="30"/>
  <text class="txt" x="205" y="65">Search: name/description/tag</text>

  <!-- CTA + Login (logged out) -->
  <rect class="box" x="740" y="45" width="140" height="30"/>
  <text class="txt" x="755" y="65">提交 Skill</text>
  <rect class="box" x="900" y="45" width="120" height="30"/>
  <text class="txt" x="930" y="65">登录</text>

  <text class="txt title" x="20" y="125">已登录态（替换右侧区域）</text>

  <!-- Logged in replacement -->
  <rect class="dash" x="740" y="140" width="280" height="60"/>
  <text class="txt" x="750" y="165">用户头像 + 用户名 ▾</text>
  <text class="txt" x="750" y="188">下拉：退出登录</text>

  <!-- Note -->
  <text class="txt" x="40" y="205">说明：点击“提交 Skill/提交实践”若未登录 → 先登录再跳转 GitHub Issue。</text>
</svg>

---

## 2. 首页：Skill 目录页（默认态，含 Banner + 列表）

<svg width="1200" height="980" viewBox="0 0 1200 980" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Home / Directory page wireframe">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <!-- Header -->
  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>
  <rect class="box" x="40" y="45" width="120" height="30"/><text class="txt" x="55" y="65">Logo</text>
  <rect class="box" x="190" y="45" width="520" height="30"/><text class="txt" x="205" y="65">Search</text>
  <rect class="box" x="740" y="45" width="140" height="30"/><text class="txt" x="755" y="65">提交 Skill</text>
  <rect class="box" x="900" y="45" width="120" height="30"/><text class="txt" x="930" y="65">登录/头像</text>

  <!-- Banner (Hero + Carousel) -->
  <rect class="box" x="20" y="110" width="1160" height="220"/>
  <text class="txt title" x="30" y="135">Banner：左侧 Logo + Slogan｜右侧 运营精选实践轮播</text>
  <text class="txt muted" x="30" y="158">说明：展示与筛选/搜索无关；内容由运营通过 featured_rank 配置；右侧为轮播（箭头+圆点）</text>

  <!-- Left: Brand -->
  <rect class="box" x="40" y="175" width="520" height="135"/>
  <text class="txt" x="55" y="205">SkillCN</text>
  <text class="txt muted" x="55" y="230">Slogan：一站式 Agent Skill 市场</text>
  <text class="txt muted" x="55" y="255">说明文案：帮助你快速找到可用 Skill</text>

  <!-- Right: Carousel (single card) -->
  <rect class="box" x="580" y="175" width="580" height="135"/>
  <text class="txt" x="595" y="205">Practice（Slide 1/6）</text>
  <text class="txt muted" x="595" y="230">title / summary(1-2行)</text>
  <text class="txt muted" x="595" y="255">channel · updated_at · 关联 Skill（可选）</text>
  <rect class="box" x="585" y="275" width="36" height="26"/><text class="txt" x="597" y="293">‹</text>
  <rect class="box" x="1118" y="275" width="36" height="26"/><text class="txt" x="1130" y="293">›</text>
  <text class="txt muted" x="860" y="293">● ○ ○ ○ ○ ○</text>

  <!-- Filter row -->
  <rect class="box" x="20" y="350" width="1160" height="60"/>
  <text class="txt title" x="30" y="375">筛选与排序</text>
  <rect class="box" x="40" y="375" width="600" height="25"/>
  <text class="txt" x="50" y="392">Tags: All | 研究 | 编程 | 写作 | 数据分析 | 设计 | 生产力</text>
  <rect class="box" x="920" y="372" width="240" height="30"/>
  <text class="txt" x="935" y="392">Sort: 热度最高 / 最近更新</text>

  <!-- List -->
  <rect class="box" x="20" y="430" width="1160" height="440"/>
  <text class="txt title" x="30" y="455">Skill 列表（仅 is_listed=true）</text>

  <!-- Card grid: 2 columns -->
  <!-- Row 1 -->
  <rect class="box" x="40" y="475" width="560" height="180"/>
  <text class="txt" x="55" y="500">Skill Name (click → 详情)</text>
  <text class="txt muted" x="55" y="522">description (1–2行)</text>
  <rect class="box" x="55" y="540" width="90" height="22"/><text class="txt" x="65" y="556">Tag</text>
  <text class="txt" x="55" y="585">Stars: 123   Heat: 456</text>
  <text class="txt" x="55" y="608">Owner: (avatar) name</text>
  <text class="txt" x="55" y="631">Practices: 2   Updated: 2026-01-10</text>

  <rect class="box" x="620" y="475" width="540" height="180"/>
  <text class="txt" x="635" y="500">Skill Name</text>
  <text class="txt muted" x="635" y="522">description</text>
  <rect class="box" x="635" y="540" width="90" height="22"/><text class="txt" x="645" y="556">Tag</text>
  <text class="txt" x="635" y="585">Stars: -   Heat: -</text>
  <text class="txt" x="635" y="608">Owner: (avatar) name</text>
  <text class="txt" x="635" y="631">Practices: 0   Updated: -</text>

  <!-- Row 2 -->
  <rect class="box" x="40" y="670" width="560" height="180"/>
  <text class="txt" x="55" y="695">Skill Name</text>
  <text class="txt muted" x="55" y="717">description</text>
  <rect class="box" x="55" y="735" width="90" height="22"/><text class="txt" x="65" y="751">Tag</text>
  <text class="txt" x="55" y="780">Stars: 20   Heat: 1003</text>
  <text class="txt" x="55" y="803">Owner: (avatar) name</text>
  <text class="txt" x="55" y="826">Practices: 1   Updated: 2026-01-08</text>

  <rect class="box" x="620" y="670" width="540" height="180"/>
  <text class="txt" x="635" y="695">Skill Name</text>
  <text class="txt muted" x="635" y="717">description</text>
  <rect class="box" x="635" y="735" width="90" height="22"/><text class="txt" x="645" y="751">Tag</text>
  <text class="txt" x="635" y="780">Stars: 999   Heat: 150</text>
  <text class="txt" x="635" y="803">Owner: (avatar) name</text>
  <text class="txt" x="635" y="826">Practices: 0   Updated: 2025-12-12</text>

  <!-- Pagination -->
  <rect class="box" x="20" y="890" width="1160" height="50"/>
  <text class="txt" x="30" y="920">Pagination: Prev  1  2  3  Next    (20条/页)</text>

  <!-- Footer -->
  <text class="txt muted" x="20" y="965">Footer：免责声明</text>
</svg>

---

## 3. 首页：空态（搜索/筛选无结果）

<svg width="1200" height="660" viewBox="0 0 1200 660" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Home empty state">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <!-- Banner -->
  <rect class="box" x="20" y="110" width="1160" height="220"/>
  <text class="txt title" x="30" y="135">Banner：左侧品牌区｜右侧精选实践轮播（保持展示）</text>

  <rect class="box" x="40" y="160" width="520" height="150"/>
  <text class="txt muted" x="55" y="190">Brand (Logo + Slogan)</text>

  <rect class="box" x="580" y="160" width="580" height="150"/>
  <text class="txt muted" x="595" y="190">Practice Carousel</text>

  <!-- Filter row -->
  <rect class="box" x="20" y="350" width="1160" height="60"/>
  <text class="txt title" x="30" y="380">筛选与排序（保持）</text>

  <!-- Empty list -->
  <rect class="box" x="20" y="430" width="1160" height="140"/>
  <text class="txt title" x="30" y="460">空态（Skill 列表）</text>
  <text class="txt" x="30" y="495">暂无结果</text>
  <text class="txt muted" x="30" y="520">建议：检查关键词/切换标签/清空筛选</text>

  <rect class="box" x="30" y="590" width="140" height="36"/><text class="txt" x="45" y="614">清空搜索</text>
  <rect class="box" x="190" y="590" width="140" height="36"/><text class="txt" x="205" y="614">清空筛选</text>
</svg>

---

## 3.1 首页：加载中（骨架屏）

<svg width="1200" height="700" viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Home loading skeleton state">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <rect class="dash" x="20" y="110" width="1160" height="220"/>
  <text class="txt muted" x="30" y="140">Banner Skeleton（Brand + Carousel）</text>
  <rect class="dash" x="40" y="160" width="520" height="150"/>
  <rect class="dash" x="580" y="160" width="580" height="150"/>

  <rect class="box" x="20" y="350" width="1160" height="60"/>
  <text class="txt title" x="30" y="380">筛选与排序（可先展示）</text>

  <rect class="dash" x="20" y="430" width="1160" height="200"/>
  <text class="txt muted" x="30" y="460">Skill Card Skeletons</text>
  <rect class="dash" x="40" y="480" width="540" height="120"/>
  <rect class="dash" x="600" y="480" width="560" height="120"/>

  <rect class="dash" x="20" y="650" width="1160" height="40"/>
  <text class="txt muted" x="30" y="675">Pagination Skeleton</text>
</svg>

---

## 4. Skill 详情页（默认态：有实践 + SKILL.md 正常渲染）

<svg width="1200" height="1120" viewBox="0 0 1200 1120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skill detail page wireframe">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <!-- Header -->
  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <!-- Title block -->
  <rect class="box" x="20" y="110" width="1160" height="120"/>
  <text class="txt title" x="30" y="135">Skill 标题区</text>
  <text class="txt" x="30" y="165">Name</text>
  <rect class="box" x="90" y="150" width="90" height="22"/><text class="txt" x="102" y="166">Tag</text>
  <text class="txt muted" x="30" y="200">description（简短描述）</text>

  <!-- Repo info -->
  <rect class="box" x="20" y="250" width="760" height="90"/>
  <text class="txt title" x="30" y="275">仓库信息</text>
  <text class="txt" x="30" y="305">Owner: (avatar) name</text>
  <text class="txt" x="300" y="305">Stars: 123</text>
  <rect class="box" x="520" y="290" width="220" height="30"/><text class="txt" x="535" y="310">Source（外链）</text>

  <!-- Actions -->
  <rect class="box" x="800" y="250" width="380" height="90"/>
  <text class="txt title" x="810" y="275">操作区</text>
  <rect class="box" x="820" y="290" width="130" height="30"/><text class="txt" x="835" y="310">下载 ZIP</text>
  <rect class="dash" x="970" y="290" width="170" height="30"/><text class="txt muted" x="985" y="310">Run（敬请期待）</text>

  <!-- Basic info -->
  <rect class="box" x="20" y="360" width="1160" height="80"/>
  <text class="txt title" x="30" y="385">基础信息</text>
  <text class="txt" x="30" y="415">skill_id: abc123  [复制]</text>
  <text class="txt" x="380" y="415">updated_at: 2026-01-10</text>
  <text class="txt" x="680" y="415">heat_score: 456</text>

  <!-- Practices -->
  <rect class="box" x="20" y="460" width="1160" height="320"/>
  <text class="txt title" x="30" y="485">实践区（仅 is_listed=true；按 updated_at 倒序）</text>
  <rect class="box" x="1000" y="470" width="160" height="30"/><text class="txt" x="1015" y="490">提交实践</text>

  <!-- Practice cards -->
  <rect class="box" x="40" y="510" width="1120" height="80"/>
  <text class="txt" x="55" y="540">Practice Title</text>
  <text class="txt muted" x="55" y="562">summary · channel · updated_at · click_count</text>
  <text class="txt muted" x="920" y="562">click→外链 + click_count+1</text>

  <rect class="box" x="40" y="605" width="1120" height="80"/>
  <text class="txt" x="55" y="635">Practice Title</text>
  <text class="txt muted" x="55" y="657">summary · channel · updated_at · click_count</text>

  <rect class="box" x="40" y="700" width="1120" height="60"/>
  <text class="txt muted" x="55" y="735">... 更多实践（滚动）</text>

  <!-- Content -->
  <rect class="box" x="20" y="800" width="1160" height="280"/>
  <text class="txt title" x="30" y="825">内容区：SKILL.md</text>
  <text class="txt muted" x="30" y="850">默认按 Markdown 渲染（若含相对资源链接则降级为纯文本）</text>
  <rect class="dash" x="40" y="870" width="1120" height="190"/>
  <text class="txt muted" x="55" y="900">[Markdown Rendered Content]</text>
</svg>

---

## 5. Skill 详情页：实践空态

<svg width="1200" height="520" viewBox="0 0 1200 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skill detail no practice state">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <rect class="box" x="20" y="110" width="1160" height="380"/>
  <text class="txt title" x="30" y="140">实践区（空态）</text>
  <text class="txt" x="30" y="180">暂无实践</text>
  <text class="txt muted" x="30" y="205">提交一个实践，帮助更多人理解怎么用</text>
  <rect class="box" x="30" y="235" width="160" height="36"/>
  <text class="txt" x="45" y="259">提交实践</text>
</svg>

---

## 6. Skill 详情页：SKILL.md 降级为“纯文本展示”

<svg width="1200" height="560" viewBox="0 0 1200 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skill detail SKILL.md raw text fallback">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <rect class="box" x="20" y="110" width="1160" height="430"/>
  <text class="txt title" x="30" y="140">内容区：SKILL.md（纯文本）</text>
  <text class="txt muted" x="30" y="170">触发条件：检测到相对图片/链接资源；保留换行与空格，可复制</text>
  <rect class="dash" x="40" y="190" width="1120" height="300"/>
  <text class="txt muted" x="55" y="220"># SKILL Title</text>
  <text class="txt muted" x="55" y="245">...</text>
  <rect class="box" x="40" y="505" width="220" height="30"/>
  <text class="txt" x="55" y="525">前往 Source</text>
</svg>

---

## 7. GitHub 登录页（OAuth）

<svg width="1200" height="520" viewBox="0 0 1200 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub OAuth login page">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <rect class="box" x="320" y="140" width="560" height="300"/>
  <text class="txt title" x="340" y="175">登录 SkillCN</text>
  <text class="txt muted" x="340" y="205">用于提交 Skill / 实践（浏览不需要登录）</text>
  <rect class="box" x="340" y="250" width="520" height="44"/>
  <text class="txt" x="355" y="278">使用 GitHub 登录（OAuth）</text>
  <rect class="dash" x="340" y="315" width="520" height="90"/>
  <text class="txt muted" x="355" y="345">登录成功 → 返回上一个页面</text>
  <text class="txt muted" x="355" y="370">失败 → 提示 + 重试</text>
</svg>

---

## 8. 关键流程：提交 Skill / 提交实践（登录门槛 + 跳转 GitHub Issue）

<svg width="1200" height="360" viewBox="0 0 1200 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Submit flow wireframe">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .arrow { fill: none; stroke: #111; stroke-width: 2; marker-end: url(#arrowhead); }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#111"/>
    </marker>
  </defs>

  <text class="txt title" x="20" y="35">流程：提交 Skill / 提交实践</text>

  <rect class="box" x="40" y="70" width="260" height="110"/>
  <text class="txt" x="55" y="100">用户点击 CTA</text>
  <text class="txt muted" x="55" y="125">提交 Skill / 提交实践</text>

  <line class="arrow" x1="300" y1="125" x2="380" y2="125"/>

  <rect class="box" x="380" y="70" width="320" height="110"/>
  <text class="txt" x="395" y="100">若未登录</text>
  <text class="txt muted" x="395" y="125">→ 跳转登录页（OAuth）</text>

  <line class="arrow" x1="700" y1="125" x2="780" y2="125"/>

  <rect class="box" x="780" y="70" width="380" height="110"/>
  <text class="txt" x="795" y="100">登录成功 / 已登录</text>
  <text class="txt muted" x="795" y="125">→ 直接跳转 GitHub Issue</text>
  <text class="txt muted" x="795" y="150">（使用对应 Issue 模板）</text>

  <rect class="dash" x="40" y="210" width="1120" height="110"/>
  <text class="txt" x="55" y="240">GitHub Issue 页面（站外）</text>
  <text class="txt muted" x="55" y="265">用户按模板填写并提交 → 站内不展示“审核中/已拒绝”等状态</text>
  <text class="txt muted" x="55" y="290">处理 SLA：3 天（由维护者在 GitHub Issue 中沟通）</text>
</svg>

---

## 9. 错误/异常页：Skill 不存在 / 已下架

<svg width="1200" height="420" viewBox="0 0 1200 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Skill missing / removed page">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <rect class="box" x="20" y="110" width="1160" height="280"/>
  <text class="txt title" x="30" y="140">错误提示</text>
  <text class="txt" x="30" y="180">该 Skill 不存在或已被移除</text>
  <text class="txt muted" x="30" y="205">可能原因：ID 不正确 / 已下架 / 已删除</text>
  <rect class="box" x="30" y="240" width="160" height="36"/>
  <text class="txt" x="45" y="264">返回首页</text>
</svg>

---

## 10. 异常：SKILL.md 内容加载失败（重试）

<svg width="1200" height="520" viewBox="0 0 1200 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SKILL.md load failed state">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <rect class="box" x="20" y="110" width="1160" height="380"/>
  <text class="txt title" x="30" y="140">内容区：SKILL.md（加载失败）</text>
  <rect class="dash" x="40" y="165" width="1120" height="240"/>
  <text class="txt" x="55" y="205">内容加载失败</text>
  <text class="txt muted" x="55" y="230">可重试；同时提供前往 Source 兜底</text>
  <rect class="box" x="55" y="265" width="140" height="36"/>
  <text class="txt" x="80" y="289">重试</text>
  <rect class="box" x="215" y="265" width="160" height="36"/>
  <text class="txt" x="240" y="289">前往 Source</text>
</svg>

---

## 11. 异常：下载 ZIP 失败（提示 + 兜底）

<svg width="1200" height="380" viewBox="0 0 1200 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Download ZIP failed state">
  <style>
    .box { fill: none; stroke: #111; stroke-width: 2; }
    .dash { fill: none; stroke: #111; stroke-width: 2; stroke-dasharray: 6 6; }
    .txt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; fill: #111; }
    .title { font-size: 16px; font-weight: 700; }
    .muted { fill: #666; }
  </style>

  <rect class="box" x="20" y="20" width="1160" height="70"/>
  <text class="txt title" x="30" y="45">Header</text>

  <!-- Content placeholder -->
  <rect class="dash" x="20" y="110" width="1160" height="240"/>
  <text class="txt muted" x="30" y="140">任意页面区域（例如 Skill 详情页）</text>

  <!-- Toast / Alert -->
  <rect class="box" x="320" y="150" width="560" height="140"/>
  <text class="txt title" x="340" y="180">下载失败</text>
  <text class="txt muted" x="340" y="210">请稍后重试，或前往 Source 手动下载</text>
  <rect class="box" x="340" y="235" width="140" height="36"/>
  <text class="txt" x="365" y="259">重试</text>
  <rect class="box" x="500" y="235" width="160" height="36"/>
  <text class="txt" x="525" y="259">前往 Source</text>
  <rect class="box" x="680" y="235" width="180" height="36"/>
  <text class="txt" x="725" y="259">关闭</text>

  <text class="txt muted" x="20" y="365">注：点击“下载 ZIP”即计 download_count（不依赖下载是否成功）。</text>
</svg>
