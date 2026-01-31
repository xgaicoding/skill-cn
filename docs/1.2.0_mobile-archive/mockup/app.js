/**
 * Skill Hub 中国 v1.2.0 - Mobile Mockup Script
 * ------------------------------------------------------------
 * 说明：
 * - 仅用于静态 mockup 的交互演示，不代表最终线上实现。
 * - 目标：验证“移动端信息架构 + 交互口径”是否顺滑：
 *   - Hero：横向轮播（第 1 张品牌卡 + 推荐实践卡片）
 *   - 模式切换：底部 Segmented，滚动下隐藏/上滑或停住显示
 *   - 筛选条：吸顶（sticky），标签横滑 + 排序二选一
 *   - 列表：无限滚动（加载中/失败重试/已到底）+ 回到顶部按钮
 *   - 实践卡：点击任意区域弹 Bottom Sheet ActionSheet（信息区 + 两动作）
 *
 * 性能注意：
 * - 滚动监听用 rAF 合并，避免高频 setState/DOM 读写抖动
 * - 动效由 CSS 通过 transform/opacity 驱动（GPU 友好）
 */

(function () {
  // -----------------------------
  // 0. Mock 数据（用于示意，不与真实接口一致）
  // -----------------------------
  const TAGS = ["全部", "研究", "编程", "写作", "数据分析", "设计", "生产力"];

  /** @type {Array<{id:number; tag:string; heat:number; updatedAt:string; name:string; description:string; owner:string; practiceCount:number;}>} */
  const SKILLS = [
    {
      id: 1,
      tag: "设计",
      heat: 9.6,
      updatedAt: "2026-01-25",
      name: "ui-ux-pro-max",
      description: "UI/UX 设计智能：风格、色板、字体、组件与交互建议，帮你快速做出“像人做的”界面。",
      owner: "Skill Hub",
      practiceCount: 12,
    },
    {
      id: 11,
      tag: "编程",
      heat: 9.2,
      updatedAt: "2026-01-23",
      name: "supabase",
      description: "Supabase 集成与最佳实践：鉴权、数据库、性能优化与部署落地一条龙。",
      owner: "Supabase",
      practiceCount: 6,
    },
    {
      id: 12,
      tag: "生产力",
      heat: 9.1,
      updatedAt: "2026-01-20",
      name: "agent-browser",
      description: "自动化浏览器操作：导航页面、填写表单、截图与数据提取，用于 Web 测试与自动化任务。",
      owner: "Skill Hub",
      practiceCount: 4,
    },
    {
      id: 8,
      tag: "写作",
      heat: 8.9,
      updatedAt: "2026-01-18",
      name: "skill-creator",
      description: "创建 Skill 的最佳实践与模板：快速把你的工作流封装成可复用的 Agent 能力。",
      owner: "Skill Hub",
      practiceCount: 9,
    },
    {
      id: 15,
      tag: "研究",
      heat: 8.8,
      updatedAt: "2026-01-14",
      name: "product-research",
      description: "产品方案与调研助手：从问题定义到方案对比，输出结构化 PRD 与路线图。",
      owner: "Community",
      practiceCount: 3,
    },
    {
      id: 17,
      tag: "数据分析",
      heat: 8.6,
      updatedAt: "2026-01-10",
      name: "notebooklm",
      description: "知识库与笔记分析：从资料中提炼观点、生成提纲与输出内容结构。",
      owner: "Google",
      practiceCount: 2,
    },
  ];

  const skillById = new Map(SKILLS.map((s) => [s.id, s]));

  /** @type {Array<{id:number; title:string; summary:string; channel:string; author:string; updatedAt:string; views:number; url:string; skillIds:number[];}>} */
  const PRACTICES = [
    {
      id: 5,
      title: "小白如何使用 AI 编程，快速打造商用级 UI",
      summary:
        "不懂前端、不懂设计，也能做出商用级精致页面？大厂 UI 流程 × AI 多 Agent × 实战打法，从需求、线稿、视觉稿到代码，全程 AI 跑通。",
      channel: "公众号",
      author: "骁哥AI编程",
      updatedAt: "2026-01-08",
      views: 127,
      url: "https://example.com/practice/5",
      skillIds: [1, 12],
    },
    {
      id: 7,
      title: "0 基础小白建站：Supabase 免费数据库手把手教学",
      summary:
        "Supabase 作为当前最火的云存储服务，基本是建站标配。本文手把手教你接入 Supabase，并用官方 skill 做性能优化。",
      channel: "公众号",
      author: "骁哥AI编程",
      updatedAt: "2026-01-25",
      views: 104,
      url: "https://example.com/practice/7",
      skillIds: [11],
    },
    {
      id: 8,
      title: "这个 Skill 自动操作浏览器，扒出了我的网购记录 0.0！？",
      summary:
        "一个可以操作浏览器的 skill：自动登录、翻页、抓取订单数据，并导出为结构化结果（仅演示合法场景）。",
      channel: "公众号",
      author: "骁哥AI编程",
      updatedAt: "2026-01-25",
      views: 102,
      url: "https://example.com/practice/8",
      skillIds: [12, 1],
    },
    {
      id: 13,
      title: "如何在 Cursor / TRAE 中，用 Skills 3 分钟制作精美 PPT",
      summary: "手把手教你用 Skill 做一份精美 PPT，从结构到配色一键到位。",
      channel: "公众号",
      author: "骁哥AI编程",
      updatedAt: "2026-01-25",
      views: 102,
      url: "https://example.com/practice/13",
      skillIds: [15, 8],
    },
    {
      id: 17,
      title: "Remotion Skills 让我扔掉了视频剪辑软件！",
      summary: "让 AI 写代码，然后自动生成视频：基于 Remotion 的可复用制作流程与模板化输出。",
      channel: "公众号",
      author: "我姚学AI",
      updatedAt: "2026-01-25",
      views: 103,
      url: "https://example.com/practice/17",
      skillIds: [1, 8],
    },
  ];

  // Hero 推荐：第 1 张品牌卡 + 若干实践卡（这里直接复用 PRACTICES）
  const FEATURED = PRACTICES.slice(0, 4);

  // -----------------------------
  // 1. 状态（mock 交互状态机）
  // -----------------------------
  const state = {
    mode: "skills", // "skills" | "practices"
    tag: "全部",
    q: "",
    sort: "heat", // "heat" | "recent"
    ids: /** @type {number[]} */ ([]), // skills 模式下的“锁定 skill 集合”

    page: 1,
    pageSize: 5,
    hasMore: true,
    loading: false,
    error: false,
  };

  // -----------------------------
  // 2. DOM 引用
  // -----------------------------
  const els = {
    // Header
    searchInput: /** @type {HTMLInputElement | null} */ (document.querySelector("#searchInput")),

    // Hero
    heroTrack: /** @type {HTMLDivElement | null} */ (document.querySelector("#heroTrack")),
    heroDots: /** @type {HTMLDivElement | null} */ (document.querySelector("#heroDots")),

    // Toolbar
    toolbar: /** @type {HTMLElement | null} */ (document.querySelector("#toolbar")),
    tagChips: /** @type {HTMLElement | null} */ (document.querySelector("#tagChips")),
    sortHeat: /** @type {HTMLButtonElement | null} */ (document.querySelector("#sortHeat")),
    sortRecent: /** @type {HTMLButtonElement | null} */ (document.querySelector("#sortRecent")),
    idsChip: /** @type {HTMLButtonElement | null} */ (document.querySelector("#idsChip")),
    idsChipCount: /** @type {HTMLElement | null} */ (document.querySelector("#idsChipCount")),

    // Lists
    skillsList: /** @type {HTMLElement | null} */ (document.querySelector("#skillsList")),
    practicesList: /** @type {HTMLElement | null} */ (document.querySelector("#practicesList")),
    feedFooter: /** @type {HTMLElement | null} */ (document.querySelector("#feedFooter")),
    sentinel: /** @type {HTMLElement | null} */ (document.querySelector("#sentinel")),

    // Bottom controls
    modeSwitch: /** @type {HTMLElement | null} */ (document.querySelector("#modeSwitch")),
    modeSkills: /** @type {HTMLButtonElement | null} */ (document.querySelector("#modeSkills")),
    modePractices: /** @type {HTMLButtonElement | null} */ (document.querySelector("#modePractices")),
    toTop: /** @type {HTMLButtonElement | null} */ (document.querySelector("#toTop")),

    // ActionSheet
    sheet: /** @type {HTMLElement | null} */ (document.querySelector("#sheet")),
    sheetBackdrop: /** @type {HTMLElement | null} */ (document.querySelector("#sheetBackdrop")),
    sheetTitle: /** @type {HTMLElement | null} */ (document.querySelector("#sheetTitle")),
    sheetSource: /** @type {HTMLElement | null} */ (document.querySelector("#sheetSource")),
    sheetSummary: /** @type {HTMLElement | null} */ (document.querySelector("#sheetSummary")),
    sheetMetaDate: /** @type {HTMLElement | null} */ (document.querySelector("#sheetMetaDate")),
    sheetMetaViews: /** @type {HTMLElement | null} */ (document.querySelector("#sheetMetaViews")),
    sheetSkills: /** @type {HTMLElement | null} */ (document.querySelector("#sheetSkills")),
    sheetOpenOriginal: /** @type {HTMLButtonElement | null} */ (document.querySelector("#sheetOpenOriginal")),
    sheetFilterSkills: /** @type {HTMLButtonElement | null} */ (document.querySelector("#sheetFilterSkills")),
  };

  // -----------------------------
  // 3. 工具函数
  // -----------------------------
  const formatCompact = (num) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}w`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  const safeText = (value) => (value == null ? "" : String(value));

  /**
   * 根据当前模式给出搜索 placeholder：
   * - skills：搜索 Skill 名称/描述/标签
   * - practices：搜索文章标题/摘要
   */
  const getSearchPlaceholder = () =>
    state.mode === "practices" ? "搜索文章标题、描述" : "搜索 Skill 名称、描述、标签";

  /**
   * 从实践数据推导“分类标签”：
   * - 真实线上：会由关联 skill 的 tag 过滤
   * - mock：简单根据 skillIds 映射为 tags 去重
   */
  const getPracticeTags = (practice) => {
    const tags = new Set();
    practice.skillIds.forEach((id) => {
      const skill = skillById.get(id);
      if (skill?.tag) tags.add(skill.tag);
    });
    return Array.from(tags);
  };

  /**
   * 从实践数据推导“关联 skills 显示”：
   * - 最多 3 个 +N
   * - 单行不折行（CSS 负责渐隐）
   */
  const getPracticeSkillBadges = (practice) => {
    const all = practice.skillIds
      .map((id) => skillById.get(id))
      .filter(Boolean)
      .map((s) => s.name);
    const visible = all.slice(0, 3);
    const more = Math.max(all.length - 3, 0);
    return { visible, more };
  };

  // -----------------------------
  // 4. 过滤/排序：按模式返回“可渲染数据源”
  // -----------------------------
  const getFilteredSkills = () => {
    let items = SKILLS.slice();

    // ids 锁定集合：只在 skills 模式生效
    if (state.ids.length > 0) {
      const allowed = new Set(state.ids);
      items = items.filter((s) => allowed.has(s.id));
    }

    if (state.tag !== "全部") {
      items = items.filter((s) => s.tag === state.tag);
    }

    if (state.q) {
      const q = state.q.toLowerCase();
      items = items.filter((s) => `${s.name} ${s.description} ${s.tag}`.toLowerCase().includes(q));
    }

    if (state.sort === "recent") {
      items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.heat - a.heat);
    } else {
      items.sort((a, b) => b.heat - a.heat || b.updatedAt.localeCompare(a.updatedAt));
    }

    return items;
  };

  const getFilteredPractices = () => {
    let items = PRACTICES.slice();

    if (state.tag !== "全部") {
      items = items.filter((p) => getPracticeTags(p).includes(state.tag));
    }

    if (state.q) {
      const q = state.q.toLowerCase();
      items = items.filter((p) => `${p.title} ${p.summary}`.toLowerCase().includes(q));
    }

    if (state.sort === "recent") {
      items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.views - a.views);
    } else {
      items.sort((a, b) => b.views - a.views || b.updatedAt.localeCompare(a.updatedAt));
    }

    return items;
  };

  const getDataSource = () => (state.mode === "practices" ? getFilteredPractices() : getFilteredSkills());

  // -----------------------------
  // 5. 渲染：列表（支持“重置 + 追加”）
  // -----------------------------
  const clearList = () => {
    if (els.skillsList) els.skillsList.innerHTML = "";
    if (els.practicesList) els.practicesList.innerHTML = "";
  };

  /**
   * 首屏骨架屏：
   * - 解决“首屏只有一个加载中胶囊，页面显得很空”的问题
   * - 仅用于第一页加载；后续页沿用底部 loader（更符合无限滚动的心智）
   */
  const renderInitialSkeleton = () => {
    const container = state.mode === "skills" ? els.skillsList : els.practicesList;
    if (!container) return;

    // 避免重复插入：如果已有骨架则不再插
    if (container.querySelector(".skeleton-card")) return;

    /*
      用户反馈：骨架屏需要更贴近移动端真实卡片结构。
      - skills：标题 + 描述（2 行）+ footer（2 个指标）
      - practices：标题（2 行）+ 摘要（3 行）+ footer（作者/阅读）
      同时在两列网格下，首屏用 4 张（两行）更接近“真实首屏填满”的观感。
    */
    const count = 4;
    for (let i = 0; i < count; i += 1) {
      const card = document.createElement("div");
      card.className = `card skeleton-card ${
        state.mode === "skills" ? "skeleton-card--skill" : "skeleton-card--practice"
      }`;
      card.setAttribute("aria-hidden", "true");

      // 用不同 delay 做轻微错峰，避免全部同频闪烁（视觉更高级）
      const delay = `${i * 90}ms`;
      card.innerHTML =
        state.mode === "skills"
          ? `
        <div class="skeleton-block skeleton-line skeleton-line--title" style="animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:92%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:86%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:78%;animation-delay:${delay}"></div>
        <div class="skeleton-row">
          <div class="skeleton-block skeleton-line skeleton-line--meta" style="width:46%;animation-delay:${delay}"></div>
          <div class="skeleton-block skeleton-line skeleton-line--meta" style="width:38%;animation-delay:${delay}"></div>
        </div>
      `
          : `
        <div class="skeleton-block skeleton-line" style="height:16px;width:78%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="height:16px;width:56%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:96%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:90%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:84%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:88%;animation-delay:${delay}"></div>
        <div class="skeleton-block skeleton-line" style="width:76%;animation-delay:${delay}"></div>
        <div class="skeleton-row">
          <div class="skeleton-block skeleton-line skeleton-line--meta" style="width:46%;animation-delay:${delay}"></div>
          <div class="skeleton-block skeleton-line skeleton-line--meta" style="width:32%;animation-delay:${delay}"></div>
        </div>
      `;
      container.appendChild(card);
    }
  };

  /** 清除首屏骨架卡（真实数据返回后再渲染真实卡片） */
  const clearSkeleton = () => {
    const container = state.mode === "skills" ? els.skillsList : els.practicesList;
    if (!container) return;
    container.querySelectorAll(".skeleton-card").forEach((node) => node.remove());
  };

  const updateModeVisibility = () => {
    if (!els.skillsList || !els.practicesList) return;
    const isSkills = state.mode === "skills";
    els.skillsList.hidden = !isSkills;
    els.practicesList.hidden = isSkills;

    // 搜索 placeholder 也需要随模式切换
    if (els.searchInput) {
      els.searchInput.placeholder = getSearchPlaceholder();
    }

    // 排序默认值：与线上约定一致（skills 默认最热，practices 默认最新）
    if (state.mode === "practices" && state.sort !== "heat" && state.sort !== "recent") {
      state.sort = "recent";
    }

    // ids Chip：仅 skills 模式可见
    updateIdsChip();
  };

  const updateTagChips = () => {
    if (!els.tagChips) return;
    const buttons = Array.from(els.tagChips.querySelectorAll("button"));
    buttons.forEach((btn) => {
      const value = btn.getAttribute("data-value");
      const active = value === state.tag;
      btn.classList.toggle("is-active", active);
      // 无障碍：标签是单选，使用 aria-pressed 传达状态
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  };

  const updateSortButtons = () => {
    if (!els.sortHeat || !els.sortRecent) return;
    const heatActive = state.sort === "heat";
    const recentActive = state.sort === "recent";
    els.sortHeat.classList.toggle("is-active", heatActive);
    els.sortRecent.classList.toggle("is-active", recentActive);
    // 无障碍：排序是二选一按钮组
    els.sortHeat.setAttribute("aria-pressed", heatActive ? "true" : "false");
    els.sortRecent.setAttribute("aria-pressed", recentActive ? "true" : "false");
  };

  const updateModeButtons = () => {
    if (!els.modeSkills || !els.modePractices) return;
    const skillsActive = state.mode === "skills";
    const practicesActive = state.mode === "practices";
    els.modeSkills.classList.toggle("is-active", skillsActive);
    els.modePractices.classList.toggle("is-active", practicesActive);
    // 无障碍：tablist 语义（index.html 里用 role=tab）
    els.modeSkills.setAttribute("aria-selected", skillsActive ? "true" : "false");
    els.modePractices.setAttribute("aria-selected", practicesActive ? "true" : "false");
  };

  const updateIdsChip = () => {
    if (!els.toolbar || !els.idsChip || !els.idsChipCount) return;

    const shouldShow = state.mode === "skills" && state.ids.length > 0;
    els.toolbar.setAttribute("data-has-ids", shouldShow ? "true" : "false");
    els.idsChipCount.textContent = String(new Set(state.ids).size);
  };

  const renderSkillCard = (skill) => {
    const card = document.createElement("a");
    card.className = "card skill-card";
    // mock：点击跳转到静态的详情页（仅用于验证移动端详情布局）
    card.href = "./skill-detail.html";
    card.setAttribute("aria-label", `查看 ${skill.name} 详情`);

    card.innerHTML = `
      <div class="skill-card__name">${escapeHtml(skill.name)}</div>
      <div class="skill-card__desc">${escapeHtml(skill.description)}</div>
      <div class="skill-card__footer" aria-label="Skill 数据">
        <span class="stat stat--heat" title="热度">
          ${iconFlame()}
          ${escapeHtml(String(skill.heat))}
        </span>
        <span class="stat" title="实践数量">
          ${iconFolder()}
          实践 ${escapeHtml(String(skill.practiceCount || 0))}
        </span>
      </div>
    `;

    return card;
  };

  const renderPracticeCard = (practice) => {
    const card = document.createElement("article");
    card.className = "card practice-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `打开操作：${practice.title}`);
    card.dataset.practiceId = String(practice.id);

    card.innerHTML = `
      <div class="practice-card__title">${escapeHtml(practice.title)}</div>
      <div class="practice-card__summary">${escapeHtml(practice.summary)}</div>
      <div class="practice-card__bottom">
        <span class="practice-card__author" title="${escapeAttr(practice.author)}">${escapeHtml(practice.author)}</span>
        <span class="stat">${iconEye()} ${escapeHtml(formatCompact(practice.views))}</span>
      </div>
    `;

    // 点击/键盘 Enter 打开 ActionSheet（移动端口径：点卡片任意区域弹）
    const open = () => openSheet(practice);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    return card;
  };

  const setFooterState = (next) => {
    if (!els.feedFooter) return;

    // next: {type: "loading"|"error"|"end"|"idle"}
    if (next.type === "loading") {
      els.feedFooter.innerHTML = `<span class="m-loader"><span class="spinner" aria-hidden="true"></span>加载中</span>`;
      return;
    }
    if (next.type === "error") {
      els.feedFooter.innerHTML = `
        <span class="m-loader">
          加载失败
          <!-- 重试按钮保持足够热区（chip 已是 44px 高） -->
          <button class="chip" type="button" id="retryBtn">重试</button>
        </span>
      `;
      const retry = /** @type {HTMLButtonElement | null} */ (document.querySelector("#retryBtn"));
      if (retry) {
        retry.addEventListener("click", () => {
          state.error = false;
          loadNextPage();
        });
      }
      return;
    }
    if (next.type === "end") {
      els.feedFooter.textContent = "已到底";
      return;
    }
    els.feedFooter.textContent = "";
  };

  const renderReset = () => {
    // 重置分页状态
    state.page = 1;
    state.hasMore = true;
    state.loading = false;
    state.error = false;

    clearList();
    updateModeVisibility();
    updateTagChips();
    updateSortButtons();
    updateModeButtons();

    // 首屏先出骨架卡，避免用户看到“空白 + 一个加载中”
    renderInitialSkeleton();
    setFooterState({ type: "idle" });

    // 立即加载首屏（mock：520ms 后回填真实数据）
    loadNextPage();
  };

  const loadNextPage = () => {
    if (state.loading || state.error || !state.hasMore) return;

    state.loading = true;
    // 首屏已用骨架屏表达加载，底部不再重复显示 loader；后续页才展示
    if (state.page > 1) setFooterState({ type: "loading" });

    // mock：用 setTimeout 模拟网络延迟，同时提供失败重试的展示口径
    window.setTimeout(() => {
      // 让 mock 有机会看到“失败重试”：每 4 次加载失败一次（仅演示）
      const shouldFail = state.page > 1 && state.page % 4 === 0;
      if (shouldFail) {
        state.loading = false;
        state.error = true;
        // 避免骨架一直挂着：失败时清掉骨架，让“失败重试”更明确
        if (state.page === 1) clearSkeleton();
        setFooterState({ type: "error" });
        return;
      }

      const source = getDataSource();
      const start = (state.page - 1) * state.pageSize;
      const end = start + state.pageSize;
      const slice = source.slice(start, end);

      if (slice.length === 0) {
        state.hasMore = false;
        state.loading = false;
        setFooterState({ type: "end" });
        return;
      }

      const container = state.mode === "skills" ? els.skillsList : els.practicesList;
      if (!container) return;

      // 首屏真实数据到达：先清骨架，再渲染真实卡片（避免 DOM 堆叠）
      if (state.page === 1) clearSkeleton();

      slice.forEach((item) => {
        const node = state.mode === "skills" ? renderSkillCard(item) : renderPracticeCard(item);
        container.appendChild(node);
      });

      state.page += 1;
      state.loading = false;

      // 还有更多则清空 footer（继续靠 sentinel 触发下一页），否则显示“已到底”
      if (end >= source.length) {
        state.hasMore = false;
        setFooterState({ type: "end" });
      } else {
        setFooterState({ type: "idle" });
      }
    }, 520);
  };

  // -----------------------------
  // 6. ActionSheet（Bottom Sheet）
  // -----------------------------
  /** @type {null | typeof PRACTICES[number]} */
  let activePractice = null;

  const openSheet = (practice) => {
    if (!els.sheet) return;
    activePractice = practice;

    // 信息区：标题/来源/日期/阅读量/关联 skills（用于 <=360px 情况补齐）
    if (els.sheetTitle) els.sheetTitle.textContent = practice.title;
    if (els.sheetSource) els.sheetSource.textContent = `${practice.channel}·${practice.author}`;
    if (els.sheetSummary) els.sheetSummary.textContent = practice.summary;
    if (els.sheetMetaDate) els.sheetMetaDate.textContent = practice.updatedAt;
    if (els.sheetMetaViews) els.sheetMetaViews.textContent = formatCompact(practice.views);

    if (els.sheetSkills) {
      const { visible, more } = getPracticeSkillBadges(practice);
      const names = visible.slice();
      if (more > 0) names.push(`+${more}`);
      els.sheetSkills.innerHTML = names
        .map((name) => `<span class="tag ${name.startsWith("+") ? "tag--more" : ""}">${escapeHtml(name)}</span>`)
        .join("");
    }

    els.sheet.classList.add("is-open");
    document.body.classList.add("is-sheet-open");
  };

  const closeSheet = () => {
    if (!els.sheet) return;
    els.sheet.classList.remove("is-open");
    document.body.classList.remove("is-sheet-open");
    activePractice = null;
  };

  // -----------------------------
  // 7. Hero Carousel（scroll-snap + dot + autoplay）
  // -----------------------------
  const setupHero = () => {
    if (!els.heroTrack || !els.heroDots) return;

    // 先清空 dots，再根据 slide 数量重建
    els.heroDots.innerHTML = "";

    const slides = Array.from(els.heroTrack.querySelectorAll(".m-hero__slide"));
    if (slides.length === 0) return;

    const dots = slides.map((_, index) => {
      const btn = document.createElement("button");
      btn.className = "dot";
      btn.type = "button";
      btn.setAttribute("aria-label", `切换到第 ${index + 1} 张`);
      btn.addEventListener("click", () => {
        // 使用原生滚动：浏览器会走合成层，动画较平滑
        const left = slides[index].offsetLeft;
        els.heroTrack.scrollTo({ left, behavior: "smooth" });
      });
      els.heroDots.appendChild(btn);
      return btn;
    });

    const setActiveDot = (index) => {
      dots.forEach((d, i) => d.setAttribute("aria-current", i === index ? "true" : "false"));
    };

    // 初始激活第 1 张
    setActiveDot(0);

    // scroll 过程中用一个轻量 debounce 计算当前索引（避免频繁 DOM 读写）
    let scrollTimer = /** @type {number | null} */ (null);
    const onScroll = () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const track = els.heroTrack;
        if (!track) return;

        // 找离当前 scrollLeft 最近的 slide
        const x = track.scrollLeft;
        let closest = 0;
        let minDist = Infinity;
        slides.forEach((slide, i) => {
          const dist = Math.abs(slide.offsetLeft - x);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });
        setActiveDot(closest);
      }, 80);
    };
    els.heroTrack.addEventListener("scroll", onScroll, { passive: true });

    // 自动轮播：prefers-reduced-motion 用户默认关闭，避免造成不适
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    let index = 0;
    window.setInterval(() => {
      const track = els.heroTrack;
      if (!track) return;
      index = (index + 1) % slides.length;
      track.scrollTo({ left: slides[index].offsetLeft, behavior: "smooth" });
      setActiveDot(index);
    }, 3600);
  };

  // -----------------------------
  // 8. 滚动相关交互：mode bar 显隐 + 回到顶部
  // -----------------------------
  let lastScrollY = window.scrollY;
  let scrollRaf = /** @type {number | null} */ (null);
  let scrollStopTimer = /** @type {number | null} */ (null);

  const setModeSwitchHidden = (hidden) => {
    if (!els.modeSwitch) return;
    els.modeSwitch.classList.toggle("is-hidden", hidden);
  };

  const setToTopVisible = (visible) => {
    if (!els.toTop) return;
    els.toTop.classList.toggle("is-visible", visible);
  };

  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = null;

      const y = window.scrollY;
      const dy = y - lastScrollY;

      // 下滑隐藏，上滑显示（阈值用于避免轻微抖动导致频繁闪烁）
      if (dy > 10) setModeSwitchHidden(true);
      if (dy < -10) setModeSwitchHidden(false);

      // 停止滚动后也显示（口径：向上/停住出现）
      if (scrollStopTimer) window.clearTimeout(scrollStopTimer);
      scrollStopTimer = window.setTimeout(() => setModeSwitchHidden(false), 220);

      // 回到顶部按钮：超过 1~2 屏显示（简单用 520px 作为演示阈值）
      setToTopVisible(y > 520);

      lastScrollY = y;
    });
  };

  // -----------------------------
  // 9. 事件绑定：模式/筛选/搜索/无限滚动
  // -----------------------------
  const bindEvents = () => {
    // 标签筛选：ids 存在时，点击任何 tag 先清 ids（2A 口径）
    if (els.tagChips) {
      els.tagChips.addEventListener("click", (event) => {
        const target = /** @type {HTMLElement | null} */ (event.target);
        const btn = target?.closest("button[data-value]");
        if (!btn) return;

        const next = btn.getAttribute("data-value") || "全部";
        if (state.mode === "skills" && state.ids.length > 0) {
          state.ids = [];
        }
        state.tag = next;
        renderReset();
      });
    }

    // 排序
    if (els.sortHeat) {
      els.sortHeat.addEventListener("click", () => {
        state.sort = "heat";
        renderReset();
      });
    }
    if (els.sortRecent) {
      els.sortRecent.addEventListener("click", () => {
        state.sort = "recent";
        renderReset();
      });
    }

    // 模式切换
    if (els.modeSkills) {
      els.modeSkills.addEventListener("click", () => {
        if (state.mode === "skills") return;
        state.mode = "skills";
        state.sort = "heat";
        state.tag = "全部";
        state.q = safeText(els.searchInput?.value || "");
        renderReset();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    if (els.modePractices) {
      els.modePractices.addEventListener("click", () => {
        if (state.mode === "practices") return;
        state.mode = "practices";
        state.sort = "recent";
        state.tag = "全部";
        state.q = safeText(els.searchInput?.value || "");
        // 切到实践模式时 ids 无意义：清掉，避免产生“幽灵筛选”
        state.ids = [];
        renderReset();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // ids chip 清除
    if (els.idsChip) {
      els.idsChip.addEventListener("click", () => {
        state.ids = [];
        renderReset();
      });
    }

    // 搜索：input 轻量 debounce，避免频繁重绘
    if (els.searchInput) {
      let t = /** @type {number | null} */ (null);
      els.searchInput.addEventListener("input", () => {
        if (t) window.clearTimeout(t);
        t = window.setTimeout(() => {
          state.q = safeText(els.searchInput?.value || "").trim();
          renderReset();
        }, 220);
      });
    }

    // ActionSheet：关闭逻辑（遮罩/取消）
    if (els.sheetBackdrop) {
      els.sheetBackdrop.addEventListener("click", () => closeSheet());
    }

    // ActionSheet：跳转原文
    if (els.sheetOpenOriginal) {
      els.sheetOpenOriginal.addEventListener("click", () => {
        if (!activePractice) return;
        // mock：打开示例链接（真实线上会跳转 practice.source_url）
        window.open(activePractice.url, "_blank", "noopener,noreferrer");
        closeSheet();
      });
    }

    // ActionSheet：筛选相关 Skill（本页打开，切 skills 模式 + ids 锁定集合）
    if (els.sheetFilterSkills) {
      els.sheetFilterSkills.addEventListener("click", () => {
        if (!activePractice) return;
        state.mode = "skills";
        state.sort = "heat";
        state.tag = "全部";
        state.ids = activePractice.skillIds.slice();
        closeSheet();
        renderReset();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // 回到顶部
    if (els.toTop) {
      els.toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    // 滚动：mode bar 显隐 + 回到顶部显示
    window.addEventListener("scroll", onScroll, { passive: true });
  };

  // 无限滚动：IntersectionObserver 监听 sentinel（比 scroll 判断更省）
  const setupInfiniteScroll = () => {
    if (!els.sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) loadNextPage();
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(els.sentinel);
  };

  // -----------------------------
  // 10. Icon（避免引入外部图标库，mockup 用内联 SVG）
  // -----------------------------
  const icon = (path) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

  const iconSearch = () => icon(`<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.2-3.2"></path>`);
  const iconFlame = () =>
    /*
      与线上保持一致：使用 lucide 的 Flame path（避免“最热”图标风格不一致）。
      参考：lucide-react Flame icon。
    */
    icon(
      `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>`
    );
  const iconClock = () => icon(`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v6l4 2"></path>`);
  const iconTag = () => icon(`<path d="M20 13l-7 7-11-11V2h7l11 11z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle>`);
  const iconFolder = () => icon(`<path d="M3 7h6l2 2h10v10H3V7z"></path><path d="M3 7V5h6l2 2"></path>`);
  const iconCalendar = () =>
    icon(`<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>`);
  const iconEye = () =>
    icon(`<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle>`);
  const iconArrowUp = () => icon(`<path d="M12 19V5"></path><path d="M5 12l7-7 7 7"></path>`);
  const iconX = () => icon(`<path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>`);
  const iconFilter = () => icon(`<path d="M22 3H2l8 9v7l4 2v-9l8-9z"></path>`);
  const iconExternal = () =>
    icon(
      `<path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path>`
    );
  const iconUsers = () => icon(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`);
  const iconBook = () =>
    icon(`<path d="M4 19a2 2 0 0 0 2 2h14"></path><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5z"></path>`);
  const iconGrid = () => icon(`<rect x="3" y="3" width="8" height="8" rx="1"></rect><rect x="13" y="3" width="8" height="8" rx="1"></rect><rect x="3" y="13" width="8" height="8" rx="1"></rect><rect x="13" y="13" width="8" height="8" rx="1"></rect>`);
  const iconNews = () =>
    icon(`<path d="M4 4h14v16H4z"></path><path d="M18 8h2v12a2 2 0 0 1-2 2H6"></path><path d="M8 8h6"></path><path d="M8 12h6"></path><path d="M8 16h6"></path>`);
  const iconMore = () =>
    // “更多/操作提示”图标：用于移动端实践卡右上角，增加可发现性
    icon(`<circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle>`);

  /**
   * 在 HTML 中用到的 icon 需要注入字符串，
   * 这里统一挂到 window，避免重复拼接。
   */
  window.__mockIcons = {
    iconSearch,
    iconFlame,
    iconClock,
    iconTag,
    iconFolder,
    iconCalendar,
    iconEye,
    iconArrowUp,
    iconX,
    iconFilter,
    iconExternal,
    iconUsers,
    iconBook,
    iconGrid,
    iconNews,
    iconMore,
  };

  // -----------------------------
  // 11. XSS 安全（mockup 也做基本转义，避免复制到线上时留坑）
  // -----------------------------
  const escapeHtml = (text) =>
    safeText(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const escapeAttr = escapeHtml;

  // -----------------------------
  // 12. 启动：渲染静态部分 + 绑定交互
  // -----------------------------
  const initStaticIcons = () => {
    // Header icons
    const searchIcon = document.querySelector("#searchIcon");
    if (searchIcon) searchIcon.innerHTML = iconSearch();

    const communityIcon = document.querySelector("#communityIcon");
    if (communityIcon) communityIcon.innerHTML = iconUsers();

    const docsIcon = document.querySelector("#docsIcon");
    if (docsIcon) docsIcon.innerHTML = iconBook();

    // Sort icons
    const heatIcon = document.querySelector("#heatIcon");
    if (heatIcon) heatIcon.innerHTML = iconFlame();
    const recentIcon = document.querySelector("#recentIcon");
    if (recentIcon) recentIcon.innerHTML = iconClock();

    // Mode icons
    const skillsModeIcon = document.querySelector("#skillsModeIcon");
    if (skillsModeIcon) skillsModeIcon.innerHTML = iconGrid();
    const practicesModeIcon = document.querySelector("#practicesModeIcon");
    if (practicesModeIcon) practicesModeIcon.innerHTML = iconNews();

    // To top
    if (els.toTop) els.toTop.innerHTML = iconArrowUp();

    // ids chip X
    const idsX = document.querySelector("#idsX");
    if (idsX) idsX.innerHTML = iconX();

    // ActionSheet buttons
    const sheetOpenIcon = document.querySelector("#sheetOpenIcon");
    if (sheetOpenIcon) sheetOpenIcon.innerHTML = iconExternal();
    const sheetFilterIcon = document.querySelector("#sheetFilterIcon");
    if (sheetFilterIcon) sheetFilterIcon.innerHTML = iconFilter();
  };

  const initTags = () => {
    if (!els.tagChips) return;
    els.tagChips.innerHTML = TAGS.map((t) => `<button class="chip" type="button" data-value="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join("");
  };

  const initHeroSlides = () => {
    if (!els.heroTrack) return;

    // 第 1 张：品牌卡（Logo + Slogan）
    // 视觉优化：品牌区更“大气”——放大品牌字，并保持干净（不额外加“大 S”标识）。
    const brand = document.createElement("div");
    brand.className = "m-hero__slide";
    brand.innerHTML = `
      <div class="hero-card">
        <div class="hero-card__brand">
          <span class="hero-card__badge">Skill Hub 中国</span>
        </div>
        <h2 class="hero-card__title">连接优质 Skill 与场景落地，沉淀 <em>可复用</em> 的 AI 生产力模块</h2>
        <p class="hero-card__subtitle">移动端改为横向轮播：第一张品牌卡，后面播推荐实践。</p>
      </div>
    `;

    els.heroTrack.appendChild(brand);

    // 第 2 张起：推荐实践卡
    FEATURED.forEach((p) => {
      const slide = document.createElement("div");
      slide.className = "m-hero__slide";

      slide.innerHTML = `
        <div class="hero-card hero-practice">
          <h3 class="hero-practice__h3">${escapeHtml(p.title)}</h3>
          <p class="hero-practice__desc">${escapeHtml(p.summary)}</p>
          <div class="hero-practice__meta">
            <span>${escapeHtml(p.channel)} · ${escapeHtml(p.author)}</span>
            <span>${escapeHtml(p.updatedAt)}</span>
          </div>
        </div>
      `;

      els.heroTrack.appendChild(slide);
    });
  };

  // 首次渲染前：初始化静态区域
  initStaticIcons();
  initTags();
  initHeroSlides();
  setupHero();

  // 初始 placeholder
  if (els.searchInput) {
    els.searchInput.placeholder = getSearchPlaceholder();
  }

  // 初始渲染
  updateModeButtons();
  updateTagChips();
  updateSortButtons();
  updateModeVisibility();
  bindEvents();
  setupInfiniteScroll();
  renderReset();
})();
