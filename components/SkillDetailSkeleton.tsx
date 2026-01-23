import { Skeleton } from "@/components/Skeleton";
import { MarkdownSkeleton } from "@/components/MarkdownSkeleton";

/**
 * SkillDetailSkeleton：
 * - 详情页接口未返回时的骨架屏
 * - 结构尽量贴近真实页面（Hero + Tabs + Card），减少加载完成后的布局抖动（CLS）
 */
export const SkillDetailSkeleton = () => {
  return (
    <>
      {/* Hero 区占位：保持背景氛围，但内容使用骨架替代 */}
      <section className="hero hero--detail" aria-busy="true">
        <div className="hero__bg" aria-hidden="true">
          <span className="glow glow--pink"></span>
          <span className="glow glow--orange"></span>
          <span className="glow glow--yellow"></span>
          <span className="spark spark--one"></span>
          <span className="spark spark--two"></span>
          <span className="spark spark--three"></span>
        </div>

        <div className="hero__inner hero__inner--detail">
          <div className="hero-copy hero-copy--detail">
            {/* 标题行 + 标签占位：贴近真实布局，减少加载后位移 */}
            <div className="detail-hero__title-row" aria-hidden="true">
              <div className="detail-hero__title">
                <Skeleton width="62%" height={44} variant="text" />
              </div>
              <Skeleton width={72} height={28} style={{ borderRadius: 999 }} />
            </div>

            {/* 副标题占位：两行文本 */}
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }} aria-hidden="true">
              <Skeleton width="72%" height={16} variant="text" />
              <Skeleton width="58%" height={16} variant="text" />
            </div>

            {/* 统计信息占位：热度/Star/更新时间 */}
            <div className="detail-hero__stats" aria-hidden="true">
              <Skeleton width={120} height={32} style={{ borderRadius: 999 }} />
              <Skeleton width={120} height={32} style={{ borderRadius: 999 }} />
              <Skeleton width={150} height={32} style={{ borderRadius: 999 }} />
            </div>
          </div>

          {/* 右侧面板：按钮区域占位 */}
          <aside className="detail-panel" aria-hidden="true">
            <div className="detail-panel__repo">
              <Skeleton width={48} height={48} style={{ borderRadius: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <Skeleton width="62%" height={16} variant="text" />
                <Skeleton width="76%" height={14} variant="text" />
              </div>
            </div>
            <div className="detail-panel__actions">
              <Skeleton width="100%" height={44} style={{ borderRadius: 999 }} />
            </div>
          </aside>
        </div>
      </section>

      {/* 主体区域：Tabs + 内容卡片占位 */}
      <main className="page page--detail" aria-busy="true">
        <section className="detail-switch" aria-label="内容切换（加载中）">
          {/* 与真实布局保持一致的 Tabs 结构，减少切换时的布局抖动 */}
          <input className="detail-switch__radio" type="radio" name="detail-view" id="view-practices" defaultChecked />
          <input className="detail-switch__radio" type="radio" name="detail-view" id="view-skillmd" />

          <div className="detail-switch__header" aria-hidden="true">
            {/* 左侧：Tab 占位（与真实布局一致） */}
            <div className="detail-switch__left">
              <div className="detail-switch__tabs">
                <label className="detail-switch__tab" htmlFor="view-practices">
                  热门实践
                </label>
                <label className="detail-switch__tab" htmlFor="view-skillmd">
                  SKILL.md
                </label>
                <span className="detail-switch__indicator" aria-hidden="true" />
              </div>
            </div>

            {/* 右侧：排序按钮占位 */}
            <div className="detail-switch__right">
              <div style={{ display: "flex", gap: 8 }}>
                <Skeleton width={86} height={38} style={{ borderRadius: 14 }} />
                <Skeleton width={86} height={38} style={{ borderRadius: 14 }} />
              </div>
            </div>
          </div>

          <div className="detail-switch__panels">
            {/* 实践列表占位：默认选中此 Tab */}
            {/* 与 mockup/detail.html 对齐：实践区不包大容器（detail-card），卡片直接铺开更轻盈。 */}
            <section className="detail-tabpanel detail-tabpanel--practices practice-section" aria-busy="true">
              {/* 投稿引导条“弱占位”：只保留文本骨架，避免出现可点击错觉 */}
              <div className="practice-cta practice-cta--skeleton" aria-hidden="true">
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <Skeleton width="62%" height={18} variant="text" />
                  <Skeleton width="82%" height={14} variant="text" />
                </div>
              </div>
              <div className="practice-grid" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, index) => (
                  <article key={`practice-skeleton-${index}`} className="practice-card">
                    <div className="practice-card__top">
                      <Skeleton width={90} height={16} variant="text" />
                      <Skeleton width={110} height={16} variant="text" />
                    </div>
                    <Skeleton width="70%" height={22} variant="text" style={{ marginTop: 6 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                      <Skeleton width="100%" height={14} variant="text" />
                      <Skeleton width="86%" height={14} variant="text" />
                    </div>
                    <div className="practice-card__bottom">
                      <Skeleton width={140} height={14} variant="text" />
                      <Skeleton width={90} height={14} variant="text" />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* SKILL.md 占位：使用 MarkdownSkeleton 模拟阅读节奏 */}
            <section className="detail-card detail-tabpanel detail-tabpanel--skillmd" aria-busy="true">
              <header className="section-header" aria-hidden="true">
                <Skeleton width={120} height={22} variant="text" />
                <Skeleton width={96} height={32} style={{ borderRadius: 999 }} />
              </header>
              <MarkdownSkeleton lines={12} />
            </section>
          </div>
        </section>
      </main>
    </>
  );
};
