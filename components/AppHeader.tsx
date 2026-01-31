"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Search, Users } from "lucide-react";
import AuthActions from "@/components/AuthActions";
import { COMMUNITY_QR_BACKUP_URL, COMMUNITY_QR_URL, OFFICIAL_DOCS_LINK } from "@/lib/constants";
import CommunityModal from "@/components/CommunityModal";

export default function AppHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /**
   * PRD（v1.2.0 Mobile Web）：
   * - 移动端 Skill 详情页不展示搜索框（更克制，减少信息噪音）
   *
   * 重要补充（用户验收反馈）：
   * - PC 端详情页仍需要保留 Header 搜索框，否则会破坏 Header 结构与视觉对齐
   *
   * 因此这里的实现策略改为：
   * - Header 组件“始终渲染搜索框”，保证桌面端结构稳定（避免 detail 页变形）
   * - 移动端的“详情页隐藏搜索”由 `app/mobile.css` 通过 `body.is-detail` + media query 覆盖实现
   *
   * 说明：
   * - `pathname` 在此处仍会被使用（例如未来若需要做路由细分），因此保留获取
   * - 但当前版本不再用 pathname 去条件渲染搜索框，避免 PC 端回归
   */
  void pathname;
  // skills 模式下可能携带 ids=1,2,3（从实践卡片“筛选相关 Skill”进入），搜索时需要保留该筛选。
  const currentIds = searchParams?.get("ids") || "";
  // 顶部筛选条（tag/sort）现在与 URL 同步：Header 搜索提交时也需要保留，避免用户“搜一下筛选就丢了”。
  const currentTag = searchParams?.get("tag") || "";
  const currentSort = searchParams?.get("sort") || "";
  // 让输入框在刷新/分享链接后也能回显当前 q，提升“可控感”。
  const currentQuery = searchParams?.get("q") || "";
  // 搜索框引用：用于在 URL 变化时同步 input.value（避免 defaultValue 只在 mount 生效）。
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const hasOfficialDocsLink = Boolean(OFFICIAL_DOCS_LINK);
  // 控制“交流群”弹窗显示状态，避免使用链接跳转打断用户当前浏览。
  const [communityOpen, setCommunityOpen] = useState(false);
  // 触发按钮引用：用于定位与外部点击判断。
  const communityButtonRef = useRef<HTMLButtonElement | null>(null);
  // 统一管理二维码地址，便于后续替换或切换环境。
  const communityQrUrl = COMMUNITY_QR_URL;
  // 备用二维码地址：用于弹窗右侧展示。
  const communityQrBackupUrl = COMMUNITY_QR_BACKUP_URL;

  useEffect(() => {
    // Next.js App Router 下 Header 通常不会随 query 变更而 remount，
    // 因此这里手动把 URL 的 q 同步回 input.value，保证回显稳定。
    if (searchInputRef.current) {
      searchInputRef.current.value = currentQuery;
    }
  }, [currentQuery]);

  return (
    <header className="app-header" role="banner">
      <div className="app-header__inner">
        <Link className="logo" href="/" aria-label="Skill Hub 首页">
          <span className="logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img" aria-label="Logo">
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
          <span className="logo-text">Skill Hub</span>
        </Link>

        <form className="search" role="search" aria-label="全局搜索" action="/" method="get">
          {/* 保持 ids 筛选：如果带 ids，则搜索在当前锁定集合内进行（仅 skills 模式有意义）。 */}
          {currentIds ? <input type="hidden" name="ids" value={currentIds} /> : null}
          {/* 保持 tag/sort：与筛选条一致，提交搜索时也要带上（否则筛选会“突然丢失”）。 */}
          {currentTag && currentTag !== "全部" ? <input type="hidden" name="tag" value={currentTag} /> : null}
          {currentSort ? <input type="hidden" name="sort" value={currentSort} /> : null}
          <span className="search__icon" aria-hidden="true">
            <Search className="icon" />
          </span>
          <input
            type="search"
            name="q"
            ref={searchInputRef}
            /*
              PC 端 Header 搜索统一按 “Skill 搜索” 处理：
              - 视觉口径：保持旧版 Header 的占位符文案与样式（用户验收要求）
              - 交互口径：提交搜索默认回到 skills 模式（URL 不携带 mode=practices）
            */
            placeholder="搜索 Skill 名称、描述、标签"
            aria-label="搜索关键词"
          />
          <button type="submit">搜索</button>
        </form>

        <div className="nav-actions">
          <div className="nav-actions__links">
            <button
              className="ghost ghost--compact nav-actions__link nav-actions__link--community"
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
              <Users className="icon" aria-hidden="true" />
              <span>交流群</span>
            </button>
            <a
              className={`ghost ghost--compact nav-actions__link${
                hasOfficialDocsLink ? "" : " nav-actions__link--pending"
              }`}
              href={hasOfficialDocsLink ? OFFICIAL_DOCS_LINK : "#"}
              target={hasOfficialDocsLink ? "_blank" : undefined}
              rel={hasOfficialDocsLink ? "noreferrer noopener" : undefined}
              aria-label="官方文档"
              aria-disabled={!hasOfficialDocsLink}
              tabIndex={hasOfficialDocsLink ? 0 : -1}
            >
              <BookOpen className="icon" aria-hidden="true" />
              <span>官方文档</span>
            </a>
          </div>
          {/* 登录 / 提交 Skill：移动端不需要，后续用 CSS 隐藏该块即可（避免在组件里塞太多端判断）。 */}
          <div className="nav-actions__auth">
            <AuthActions />
          </div>
        </div>
      </div>

      {/* 交流群弹窗：点击按钮后展示二维码与入群说明。 */}
      <CommunityModal
        open={communityOpen}
        onClose={() => setCommunityOpen(false)}
        primaryQrUrl={communityQrUrl}
        backupQrUrl={communityQrBackupUrl}
        triggerRef={communityButtonRef}
      />
    </header>
  );
}
