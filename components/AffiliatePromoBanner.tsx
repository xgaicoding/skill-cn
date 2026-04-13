"use client";

import { ArrowRight, BadgePercent, Sparkles } from "lucide-react";
import { AFFILIATE_PROMO_CAMPAIGN, AFFILIATE_PROMO_LINK } from "@/lib/constants";
import { trackEvent, trackOutboundLink } from "@/lib/analytics";

const PROMO_HIGHLIGHTS = ["Claude / GPT / Gemini", "统一入口更省心", "新用户限时 5 折"];

export default function AffiliatePromoBanner({
  className = "",
  placement = "global_top_banner",
  variant = "hero",
}: {
  className?: string;
  placement?: string;
  variant?: "hero" | "inline";
}) {
  const handleClick = () => {
    trackEvent("affiliate_promo_click", {
      placement,
      campaign: AFFILIATE_PROMO_CAMPAIGN,
      destination: "kailing_register",
      discount: "50_off",
    });

    trackOutboundLink(AFFILIATE_PROMO_LINK, placement);
  };

  const isInline = variant === "inline";

  return (
    <section
      className={`affiliate-banner ${isInline ? "affiliate-banner--inline" : ""} ${className}`.trim()}
      aria-label="中转站限时特惠"
    >
      <div className="affiliate-banner__inner">
        <div className="affiliate-banner__eyebrow">
          <BadgePercent className="icon affiliate-banner__eyebrow-icon" aria-hidden="true" />
          <span>专属注册链接 · 新用户限时 5 折</span>
        </div>

        <div className="affiliate-banner__content">
          <div className="affiliate-banner__copy">
            <p className="affiliate-banner__title">
              {isInline ? (
                <>
                  Claude / GPT / Gemini 一站式接入，<strong>现在注册就能锁定 5 折</strong>
                </>
              ) : (
                <>
                  常用大模型一站式接入，<strong>新用户全模型限时 5 折</strong>
                </>
              )}
            </p>
            <p className="affiliate-banner__desc">
              {isInline
                ? "不只是便宜一点，而是常用模型都能直接省。走专属链接注册，先把 5 折权益锁住，再开始接入、写代码、跑 Agent，会更划算。"
                : "通过专属链接注册，Claude、GPT、Gemini 等常用模型都能直接用。先锁定 5 折权益，再开始调用和消耗，更省钱也更省心。"}
            </p>

            <div className="affiliate-banner__highlights" aria-label="活动卖点">
              {PROMO_HIGHLIGHTS.map((item) => (
                <span key={item} className="affiliate-banner__highlight">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <a
            className="affiliate-banner__cta"
            href={AFFILIATE_PROMO_LINK}
            target="_blank"
            rel="noreferrer noopener"
            onClick={handleClick}
          >
            <Sparkles className="icon" aria-hidden="true" />
            <span>{isInline ? "立即注册领 5 折" : "立即锁定 5 折"}</span>
            <ArrowRight className="icon" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
