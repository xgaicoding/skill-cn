/**
 * Skill Hub 中国 v1.2.0 - Mobile Mockup Script (Skill Detail)
 * ------------------------------------------------------------
 * 目标：
 * - 验证“移动端详情页”对 PC 专属能力的降级交互：
 *   点击后统一 toast 提示：请前往 PC 版网页使用功能
 * - 验证“详情页关联实践列表”的移动端口径：
 *   - 无限滚动加载
 *   - 一行两张（两列网格）
 *
 * 说明：
 * - 这里不做真实的登录/下载/投稿逻辑，仅展示交互口径。
 */

(function () {
  const toast = /** @type {HTMLElement | null} */ (document.querySelector("#toast"));
  if (!toast) return;

  let timer = /** @type {number | null} */ (null);

  /**
   * 轻量 toast：
   * - 仅做 opacity/transform 过渡（GPU 友好）
   * - 自动消失，避免占用屏幕空间
   */
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");

    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      timer = null;
    }, 2000);
  };

  // PC 专属入口：统一拦截并提示
  document.addEventListener("click", (event) => {
    const target = /** @type {HTMLElement | null} */ (event.target);
    const el = target?.closest("[data-pc-only='true']");
    if (!el) return;

    event.preventDefault();
    event.stopPropagation();
    showToast("请前往PC版网页使用功能");
  });

  // -----------------------------
  // 1) Header icons（与首页 mock 保持一致：不引入外部图标库）
  // -----------------------------
  const icon = (path) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const iconUsers = () => icon(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`);
  const iconBook = () =>
    icon(`<path d="M4 19a2 2 0 0 0 2 2h14"></path><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5z"></path>`);
  const iconCalendar = () =>
    icon(`<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>`);
  const iconEye = () =>
    icon(`<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle>`);

  const communityIcon = document.querySelector("#communityIcon");
  if (communityIcon) communityIcon.innerHTML = iconUsers();
  const docsIcon = document.querySelector("#docsIcon");
  if (docsIcon) docsIcon.innerHTML = iconBook();

  // -----------------------------
  // 2) 关联实践列表（mock 数据 + 无限滚动）
  // -----------------------------
  const practicesList = /** @type {HTMLElement | null} */ (document.querySelector("#detailPracticesList"));
  const sentinel = /** @type {HTMLElement | null} */ (document.querySelector("#detailSentinel"));
  const feedFooter = /** @type {HTMLElement | null} */ (document.querySelector("#detailFeedFooter"));

  if (!practicesList || !sentinel || !feedFooter) return;

  /**
   * Mock 数据：真实线上应来自 API（skill_id -> practices）。
   * 这里复制多份，保证滚动加载有足够“页数”可演示。
   */
  const BASE_PRACTICES = [
    {
      id: 7,
      title: "0 基础小白建站：Supabase 免费数据库手把手教学",
      summary: "Supabase 作为当前最火的云存储服务，基本是建站标配。本文手把手教你接入 Supabase，并用官方 skill 做性能优化。",
      channel: "公众号",
      author: "骁哥AI编程",
      updatedAt: "2026-01-25",
      views: 104,
      url: "https://example.com/practice/7",
    },
    {
      id: 8,
      title: "这个 Skill 自动操作浏览器，扒出了我的网购记录 0.0！？",
      summary: "一个可以操作浏览器的 skill：自动登录、翻页、抓取订单数据，并导出为结构化结果（仅演示合法场景）。",
      channel: "公众号",
      author: "骁哥AI编程",
      updatedAt: "2026-01-25",
      views: 102,
      url: "https://example.com/practice/8",
    },
    {
      id: 5,
      title: "小白如何使用 AI 编程，快速打造商用级 UI",
      summary: "不懂前端、不懂设计，也能做出商用级精致页面？大厂 UI 流程 × AI 多 Agent × 实战打法，从需求、线稿、视觉稿到代码，全程 AI 跑通。",
      channel: "公众号",
      author: "骁哥AI编程",
      updatedAt: "2026-01-08",
      views: 127,
      url: "https://example.com/practice/5",
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
    },
  ];

  /** @type {Array<typeof BASE_PRACTICES[number]>} */
  const PRACTICES = [];
  for (let i = 0; i < 4; i += 1) {
    // 追加多份并让 id 略微变化，避免 aria-label/DOM 重复时难以调试
    BASE_PRACTICES.forEach((p) => PRACTICES.push({ ...p, id: p.id + i * 100 }));
  }

  const formatCompact = (num) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}w`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
  };

  const safeText = (value) => (value == null ? "" : String(value));
  const escapeHtml = (text) =>
    safeText(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const escapeAttr = escapeHtml;

  const state = {
    page: 1,
    pageSize: 6,
    hasMore: true,
    loading: false,
    error: false,
  };

  const setFooterState = (next) => {
    // next: {type: "loading"|"error"|"end"|"idle"}
    if (next.type === "loading") {
      feedFooter.innerHTML = `<span class="m-loader"><span class="spinner" aria-hidden="true"></span>加载中</span>`;
      return;
    }
    if (next.type === "error") {
      feedFooter.innerHTML = `
        <span class="m-loader">
          加载失败
          <button class="chip" type="button" id="detailRetryBtn">重试</button>
        </span>
      `;
      const retry = /** @type {HTMLButtonElement | null} */ (document.querySelector("#detailRetryBtn"));
      if (retry) {
        retry.addEventListener("click", () => {
          state.error = false;
          loadNextPage();
        });
      }
      return;
    }
    if (next.type === "end") {
      feedFooter.textContent = "已到底";
      return;
    }
    feedFooter.textContent = "";
  };

  const renderPracticeCard = (practice) => {
    // 详情页关联实践卡：与首页实践卡保持同一视觉语言（标题 + 摘要 + 底部信息）
    const card = document.createElement("a");
    card.className = "card practice-card";
    card.href = practice.url;
    card.target = "_blank";
    card.rel = "noreferrer noopener";
    card.setAttribute("aria-label", `打开原文：${practice.title}`);

    card.innerHTML = `
      <div class="practice-card__title">${escapeHtml(practice.title)}</div>
      <div class="practice-card__summary">${escapeHtml(practice.summary)}</div>
      <div class="practice-card__bottom" aria-label="文章信息">
        <span class="practice-card__author" title="${escapeAttr(practice.author)}">${escapeHtml(practice.author)}</span>
        <span class="stat">${iconEye()} ${escapeHtml(formatCompact(practice.views))}</span>
      </div>
    `;

    return card;
  };

  const renderInitialSkeleton = () => {
    // 首屏骨架：详情页也保持一致，避免“空白等待”
    if (practicesList.querySelector(".skeleton-card")) return;
    const count = 4; // 两列布局下，4 张更接近“首屏填满”的观感
    for (let i = 0; i < count; i += 1) {
      const card = document.createElement("div");
      // 详情页列表是“实践卡”，骨架也应贴近实践卡结构（标题/摘要/footer）
      card.className = "card skeleton-card skeleton-card--practice";
      card.setAttribute("aria-hidden", "true");
      const delay = `${i * 80}ms`;
      card.innerHTML = `
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
      practicesList.appendChild(card);
    }
  };

  const clearSkeleton = () => {
    practicesList.querySelectorAll(".skeleton-card").forEach((n) => n.remove());
  };

  const loadNextPage = () => {
    if (state.loading || state.error || !state.hasMore) return;

    state.loading = true;
    if (state.page > 1) setFooterState({ type: "loading" });

    // mock：模拟网络延迟 + 偶发失败
    window.setTimeout(() => {
      const shouldFail = state.page > 1 && state.page % 5 === 0;
      if (shouldFail) {
        state.loading = false;
        state.error = true;
        if (state.page === 1) clearSkeleton();
        setFooterState({ type: "error" });
        return;
      }

      const start = (state.page - 1) * state.pageSize;
      const end = start + state.pageSize;
      const slice = PRACTICES.slice(start, end);

      if (slice.length === 0) {
        state.hasMore = false;
        state.loading = false;
        setFooterState({ type: "end" });
        return;
      }

      if (state.page === 1) clearSkeleton();

      slice.forEach((p) => practicesList.appendChild(renderPracticeCard(p)));

      state.page += 1;
      state.loading = false;

      if (end >= PRACTICES.length) {
        state.hasMore = false;
        setFooterState({ type: "end" });
      } else {
        setFooterState({ type: "idle" });
      }
    }, 520);
  };

  // 首屏先渲染骨架，再开始加载
  renderInitialSkeleton();
  setFooterState({ type: "idle" });
  loadNextPage();

  // 触底自动加载
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

  observer.observe(sentinel);
})();
