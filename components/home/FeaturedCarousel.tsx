"use client";

import { memo, useMemo, type CSSProperties } from "react";
import { Practice } from "@/lib/types";
import { FEATURED_PRACTICE_LIMIT } from "@/lib/constants";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCards } from "swiper/modules";

// 推荐卡片强调色（与视觉稿一致的暖色系梯度轮换）
const ACCENTS = [
  "rgba(255,107,0,0.98)",
  "rgba(255,204,0,0.95)",
  "rgba(255,168,0,0.92)",
  "rgba(255,107,0,0.82)",
  "rgba(255,204,0,0.82)",
  "rgba(255,155,0,0.86)",
];

function FeaturedCarousel({
  practices,
  loading = false,
}: {
  practices: Practice[];
  // Hero 推荐卡片加载状态：控制骨架与入场过渡。
  loading?: boolean;
}) {
  // Hero 卡片加载完成标记：用于触发骨架淡出与内容入场。
  const isLoaded = !loading;
  /**
   * 性能保护：Swiper 的 cards 效果会为每张卡片计算 3D transform/叠牌阴影，
   * 当推荐卡片数量过多时容易造成主线程卡顿。
   * 这里在前端再次做“渲染上限”，确保 Hero 区始终保持顺滑。
   */
  const visiblePractices = useMemo(() => {
    // 数量在阈值内时直接复用原数组引用，避免额外的 slice 分配。
    if (practices.length <= FEATURED_PRACTICE_LIMIT) {
      return practices;
    }
    return practices.slice(0, FEATURED_PRACTICE_LIMIT);
  }, [practices]);
  /**
   * 自动轮播只有在多张卡片时才有意义，数量不足时关闭自动轮播，
   * 避免无意义的定时器与多余的重绘。
   */
  const autoplayConfig =
    visiblePractices.length > 1
      ? {
          delay: 3400,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }
      : false;
  /**
   * 记录推荐卡片点击（与详情页实践卡片一致的统计方式）：
   * - 不 await，避免阻塞新窗口打开
   * - 统计失败不影响跳转
   */
  const handlePracticeClick = (practice: Practice) => {
    fetch(`/api/practices/${practice.id}/click`, { method: "POST" }).catch(() => {
      // ignore：点击统计失败不影响用户阅读
    });
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true">
        {/*
          性能优化（重要说明）：
          - 直接移除 glow / spark 装饰动画，避免 blur + transform + opacity 组合导致 GPU 持续占用
          - Hero 仍保留背景容器（hero__bg），以免影响布局与其他背景样式
        */}
      </div>

      <div className="hero__inner">
        <div className="hero-copy hero-copy--minimal">
          <h1 id="hero-title" className="hero-copy__title hero-copy__title--minimal">
            <span className="hero-copy__brand">Skill Hub 中国</span>
            <span className="hero-copy__slogan">
              {"助力国内 Skill 使用者快速找到"}{/* 重点词强调：只提升文字颜色与字重，避免块状底色造成负担。 */}<span className="hero-copy__slogan-emphasis">能用、好用、可复用</span>{"的实践方案"}
            </span>
          </h1>
          <p className="hero__subtitle">汇聚优质 Skill，打通真实场景，沉淀持续生产力</p>
        </div>

        <div
          className="hero-showcase"
          aria-label="精选实践（卡牌轮播）"
          aria-busy={!isLoaded}
          data-loaded={isLoaded ? "true" : "false"}
        >
          {/* Hero 过渡骨架：叠卡占位 + 柔光扫过，避免加载瞬间突兀 */}
          <div className="hero-showcase__skeleton" aria-hidden="true">
            <div className="hero-skeleton-deck">
              <div className="hero-skeleton-card hero-skeleton-card--back" />
              <div className="hero-skeleton-card hero-skeleton-card--mid" />
              <div className="hero-skeleton-card hero-skeleton-card--front">
                <span className="hero-skeleton-card__pill" />
                <span className="hero-skeleton-card__title" />
                <span className="hero-skeleton-card__line" />
                <span className="hero-skeleton-card__line hero-skeleton-card__line--short" />
                <span className="hero-skeleton-card__line" />
                <span className="hero-skeleton-card__line hero-skeleton-card__line--short" />
                <span className="hero-skeleton-card__footer" />
                <span className="hero-skeleton-card__sweep" aria-hidden="true" />
              </div>
            </div>
          </div>

          {visiblePractices.length > 0 && (
            <div className="hero-showcase__content">
              {/* Swiper 卡片轮播：参数与 mockup/index.html 保持一致 */}
              <Swiper
                className="practice-swiper"
                aria-label="精选实践轮播"
                effect="cards"
                grabCursor
                rewind
                speed={720}
                autoplay={autoplayConfig}
                cardsEffect={{
                  slideShadows: false,
                  rotate: true,
                  // 稍微收敛叠牌旋转与错位，让整体更稳、更贴合 Hero 文案区的节奏
                  perSlideOffset: 12,
                  perSlideRotate: 16,
                }}
                // autoplay 关闭时无需挂载 Autoplay 模块，减少额外的运行时开销。
                modules={autoplayConfig ? [Autoplay, EffectCards] : [EffectCards]}
              >
                {visiblePractices.map((practice, index) => (
                  <SwiperSlide key={practice.id}>
                    {/* 推荐卡片：顶部展示关联 Skill 名称，底部强调来源与作者 */}
                    <a
                      className="featured-card-link"
                      href={practice.source_url || "#"}
                      target={practice.source_url ? "_blank" : undefined}
                      rel={practice.source_url ? "noreferrer" : undefined}
                      aria-label={`打开实践：${practice.title}`}
                      aria-disabled={!practice.source_url}
                      onClick={(event) => {
                        // 没有链接时阻止跳转，避免跳到页面顶部。
                        if (!practice.source_url) {
                          event.preventDefault();
                          return;
                        }
                        handlePracticeClick(practice);
                      }}
                    >
                      <article
                        className="featured-card"
                        style={{ "--accent": ACCENTS[index % ACCENTS.length] } as CSSProperties}
                      >
                        <div className="featured-card__top">
                          <span className="featured-card__skill-name" title={practice.skill_name || "精选 Skill"}>
                            {practice.skill_name || "精选 Skill"}
                          </span>
                        </div>
                        <h3 className="featured-card__title">{practice.title}</h3>
                        {/* 兼容后端传入的 "\n" 字面量，替换为真实换行以配合 CSS 的 pre-line */}
                        <p className="featured-card__desc">{practice.summary.replace(/\\n/g, "\n")}</p>
                        {/* 页脚仅展示来源与作者，避免点击量干扰核心信息 */}
                        <div className="featured-card__meta">
                          <span
                            className="featured-card__from"
                            aria-label={`来自 ${practice.channel}，作者 ${practice.author_name || "未署名"}`}
                          >
                            <span className="featured-card__from-label">来自 {practice.channel}</span>
                            <span className="featured-card__from-dot" aria-hidden="true">
                              ·
                            </span>
                            <span className="featured-card__from-author">{practice.author_name || "未署名"}</span>
                          </span>
                        </div>
                      </article>
                    </a>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// 避免父级筛选/分页等状态变化时反复重建 Swiper，降低首屏卡顿感。
export default memo(FeaturedCarousel);
