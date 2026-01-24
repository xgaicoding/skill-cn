"use client";

import { useRef, useState } from "react";
import { BookOpen, Github, Mail, MessageCircle, PlusCircle, Sparkles, Users, Heart } from "lucide-react";
import {
  COMMUNITY_QR_BACKUP_URL,
  COMMUNITY_QR_URL,
  FEEDBACK_ISSUE_URL,
  OFFICIAL_DOCS_LINK,
  PRACTICE_ISSUE_URL,
  SKILL_ISSUE_URL,
} from "@/lib/constants";
import CommunityModal from "@/components/CommunityModal";

export default function AppFooter() {
  // 官方文档链接可能未配置，需要在展示时做“禁用”处理，避免误点。
  const hasOfficialDocsLink = Boolean(OFFICIAL_DOCS_LINK);
  // 年份展示放在组件内部，保证使用时无需手动维护。
  const currentYear = new Date().getFullYear();
  // 控制 Footer 里的“加入交流群”弹窗显示状态。
  const [communityOpen, setCommunityOpen] = useState(false);
  // 触发按钮引用：用于弹窗外部点击判断。
  const communityButtonRef = useRef<HTMLButtonElement | null>(null);
  // 统一管理二维码地址，与 Header 弹窗保持一致。
  const communityQrUrl = COMMUNITY_QR_URL;
  // 备用二维码地址：用于弹窗右侧展示。
  const communityQrBackupUrl = COMMUNITY_QR_BACKUP_URL;

  return (
    <footer className="footer" role="contentinfo">
      {/* 页脚整体容器：玻璃态背景 + 结构化信息分区 */}
      <div className="footer__shell">
        {/* 顶部信息网格：品牌、快速入口、社区共创、联系支持 */}
        <div className="footer__grid">
          {/* 品牌信息：Logo + 平台定位 + 核心价值 */}
          <div className="footer__brand">
            <div className="footer__brand-header">
              <span className="footer__logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img" aria-label="Skill Hub 标志">
                  <path
                    d="M12 2.8c2.4 0 4.6 1.2 5.9 3.1.6.9.9 2 1 3.1.1 1.7-.3 3.1-1.2 4.3-.4.6-1.2 1.4-2 2.1-1.7 1.4-2.5 2.6-2.8 4.5H13c.1-1.6.8-3 2.3-4.3.7-.6 1.4-1.2 1.8-1.7.6-.8.8-1.7.7-2.8-.2-1.8-1.8-3.6-4-3.9-2.6-.4-4.9 1.3-5.3 3.6-.2 1.2 0 2.2.6 3.1.4.6 1.1 1.2 1.9 1.9 1.6 1.3 2.3 2.6 2.3 4.3H11c-.3-1.9-1.1-3.1-2.8-4.5-.9-.7-1.6-1.5-2-2.1-.9-1.2-1.3-2.6-1.2-4.3.1-1.1.4-2.2 1-3.1C7.4 4 9.6 2.8 12 2.8Z"
                    fill="rgba(255,255,255,0.95)"
                  />
                  <path
                    d="M9.3 13.4c.4.6 1.1 1.2 1.9 1.9 1.6 1.3 2.3 2.6 2.3 4.3H11c-.3-1.9-1.1-3.1-2.8-4.5-.9-.7-1.6-1.5-2-2.1-.6-.8-.9-1.7-.9-2.7 0-.1 0-.2 0-.3.3.8.7 1.5 1.3 2.1Z"
                    fill="rgba(255,255,255,0.75)"
                  />
                </svg>
              </span>
              <div className="footer__brand-title-group">
                <span className="footer__brand-title">Skill Hub 中国</span>
                <span className="footer__brand-subtitle">Agent Skill 生态平台</span>
              </div>
            </div>
            <p className="footer__desc">
              连接优质 Skill 与场景落地，沉淀可复用的 AI 生产力模块，让每位开发者都能快速构建强大应用。
            </p>
            <div className="footer__status">
              <span className="footer__status-dot" aria-hidden="true"></span>
              <span>开源 • 免费 • 社区驱动</span>
            </div>
          </div>

          {/* 快速入口：页内导航 + 关键行动 */}
          <div className="footer__col">
            <h3 className="footer__title">快速入口</h3>
            <div className="footer__links">
              <a
                className={`footer__link${hasOfficialDocsLink ? "" : " footer__link--disabled"}`}
                href={hasOfficialDocsLink ? OFFICIAL_DOCS_LINK : "#"}
                target={hasOfficialDocsLink ? "_blank" : undefined}
                rel={hasOfficialDocsLink ? "noreferrer noopener" : undefined}
                aria-disabled={!hasOfficialDocsLink}
                tabIndex={hasOfficialDocsLink ? 0 : -1}
              >
                <BookOpen className="footer__link-icon" aria-hidden="true" />
                官方文档
              </a>
              <a
                className="footer__link"
                // Skill 提交入口：固定指向 create-skill 模板。
                href={SKILL_ISSUE_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                <PlusCircle className="footer__link-icon" aria-hidden="true" />
                提交 Skill
              </a>
              <a
                className="footer__link"
                // 实践分享入口：固定指向 create-practice 模板。
                href={PRACTICE_ISSUE_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Sparkles className="footer__link-icon" aria-hidden="true" />
                分享实践
              </a>
            </div>
          </div>

          {/* 社区共创：沟通入口与反馈渠道 */}
          <div className="footer__col">
            <h3 className="footer__title">社区共创</h3>
            <div className="footer__links">
              <button
                className="footer__link"
                type="button"
                aria-label="打开交流群二维码"
                aria-haspopup="dialog"
                aria-expanded={communityOpen}
                ref={communityButtonRef}
                onClick={() => {
                  if (communityOpen) {
                    setCommunityOpen(false);
                    return;
                  }
                  setCommunityOpen(true);
                }}
              >
                <Users className="footer__link-icon" aria-hidden="true" />
                加入交流群
              </button>
              <a
                className="footer__link"
                // 问题反馈入口：固定指向 feature 模板。
                href={FEEDBACK_ISSUE_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Github className="footer__link-icon" aria-hidden="true" />
                问题反馈
              </a>
            </div>
          </div>

          {/* 联系支持：用简洁文案承接合作与交流诉求 */}
          <div className="footer__col">
            <h3 className="footer__title">联系支持</h3>
            <div className="footer__meta">
              <div className="footer__meta-item">
                <Mail className="footer__meta-icon" aria-hidden="true" />
                <span>商务合作：欢迎通过社区渠道联系</span>
              </div>
              <div className="footer__meta-item">
                <MessageCircle className="footer__meta-icon" aria-hidden="true" />
                <span>技术交流：分享最佳实践与落地经验</span>
              </div>
              <div className="footer__meta-item">
                <Heart className="footer__meta-icon" aria-hidden="true" />
                <span>共建生态：一起完善 Skill 供给与模板库</span>
              </div>
            </div>
          </div>
        </div>

        {/* 免责声明：强调平台定位，降低使用误解风险 */}
        <p className="footer__disclaimer">
          免责声明：Skill Hub 仅提供信息聚合与展示。Skill 的代码与效果由其作者/来源仓库负责；使用前请自行评估风险。
        </p>

        {/* 底部信息：版权 + 价值主张 */}
        <div className="footer__bottom">
          <div className="footer__copyright">
            <span>© {currentYear} Skill Hub 中国</span>
            <span className="footer__divider" aria-hidden="true"></span>
            <span>助力国内 skill 生态发展</span>
          </div>
          <div className="footer__legal">
            <span className="footer__legal-item">开放透明 · 可信共建</span>
            <span className="footer__divider" aria-hidden="true"></span>
            <span className="footer__legal-item">Made with love in China</span>
          </div>
        </div>
      </div>

      {/* 交流群弹窗：与 Header 弹窗保持一致的交互与样式。 */}
      <CommunityModal
        open={communityOpen}
        onClose={() => setCommunityOpen(false)}
        primaryQrUrl={communityQrUrl}
        backupQrUrl={communityQrBackupUrl}
        triggerRef={communityButtonRef}
      />
    </footer>
  );
}
