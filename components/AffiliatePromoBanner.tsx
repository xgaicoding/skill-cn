"use client";

import { ArrowRight, BadgePercent, Sparkles } from "lucide-react";
import { AFFILIATE_PROMO_CAMPAIGN, AFFILIATE_PROMO_LINK } from "@/lib/constants";
import { trackEvent, trackOutboundLink } from "@/lib/analytics";

/**
 * 全站中转站推广横幅：
 * - 挂在 Header 下方，保证首页与详情页首屏都能看到
 * - 点击时同时上报 GA4 自定义活动事件和通用外链事件
 * - 文案强调“限时 5 折”和“所有模型”，降低理解成本
 */
export default function AffiliatePromoBanner({ className = "" }: { className?: string }) {
  const handleClick = () => {
    // 专用活动事件：用于后续按广告位 / campaign 单独分析转化入口。
    trackEvent("affiliate_promo_click", {
      placement: "global_top_banner",
      campaign: AFFILIATE_PROMO_CAMPAIGN,
      destination: "kailing_register",
      discount: "50_off",
    });

    // 通用外链事件：保留现有站点外链统计口径。
    trackOutboundLink(AFFILIATE_PROMO_LINK, "global_top_banner");
  };

  return (
    <section className={`affiliate-banner ${className}`.trim()} aria-label="中转站限时特惠">
      <div className="affiliate-banner__inner">
        <div className="affiliate-banner__eyebrow">
          <BadgePercent className="icon affiliate-banner__eyebrow-icon" aria-hidden="true" />
          <span>中转站限时特惠</span>
        </div>

        <div className="affiliate-banner__content">
          <div className="affiliate-banner__copy">
            <p className="affiliate-banner__title">
              通过专属链接注册，所有模型限时享 <strong>5 折</strong>
            </p>
            <p className="affiliate-banner__desc">
              点击广告跳转中转站注册页，使用该特惠链接的新用户可享受全模型 5 折优惠。
            </p>
          </div>

          <a
            className="affiliate-banner__cta"
            href={AFFILIATE_PROMO_LINK}
            target="_blank"
            rel="noreferrer noopener"
            onClick={handleClick}
          >
            <Sparkles className="icon" aria-hidden="true" />
            <span>立即领取 5 折</span>
            <ArrowRight className="icon" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
