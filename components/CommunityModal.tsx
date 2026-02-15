"use client";

import { useEffect, useRef, useState } from "react";
import { Users, X } from "lucide-react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";

type CommunityModalProps = {
  // 控制弹窗显示状态，打开时展示二维码与说明。
  open: boolean;
  // 关闭弹窗的回调（点击外部 / 按下 ESC / 点击关闭按钮）。
  onClose: () => void;
  // 交流群二维码图片地址（主二维码）。
  primaryQrUrl: string;
  // 备用二维码图片地址（用于备用入口或分流展示）。
  backupQrUrl: string;
  // 触发按钮引用：历史兼容字段（移动端改为“抽屉”后不再依赖该判断，但保留避免上层改动）。
  triggerRef?: RefObject<HTMLElement>;
};

export default function CommunityModal({
  open,
  onClose,
  primaryQrUrl,
  backupQrUrl,
}: CommunityModalProps) {
  // 面板引用：用于打开时聚焦，提升可访问性与键盘可控性。
  const panelRef = useRef<HTMLDivElement | null>(null);
  // 客户端挂载标记：用于安全地使用 portal 渲染到 body。
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    /**
     * 移动端 Drawer/Sheet 打开时锁住背景滚动：
     * - 与首页实践 ActionSheet 复用同一套 body class（见 app/mobile.css）
     * - 这样可以避免“遮罩打开但页面还能滚”的晕动感
     */
    if (!open) {
      document.body.classList.remove("is-sheet-open");
      return;
    }
    document.body.classList.add("is-sheet-open");
    return () => document.body.classList.remove("is-sheet-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // 监听 ESC 关闭弹窗，符合用户习惯。
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // 弹窗出现时主动聚焦面板，便于读屏与键盘导航。
    panelRef.current?.focus();
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="community-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-modal-title"
      aria-describedby="community-modal-desc"
    >
      {/* Backdrop：遮罩层
          - 负责点击外部关闭
          - 视觉上也用于“压暗背景”，避免内容干扰二维码阅读 */}
      <button
        type="button"
        className="community-modal__backdrop"
        aria-label="关闭弹窗"
        onClick={onClose}
      />

      <div className="community-modal__panel" ref={panelRef} tabIndex={-1} role="document">
        {/* 关闭按钮：右上角固定位置 */}
        <button className="community-modal__close" type="button" onClick={onClose} aria-label="关闭">
          <X className="icon" aria-hidden="true" />
        </button>

        <div className="community-modal__header">
          <span className="community-modal__badge">
            <Users className="icon" aria-hidden="true" />
            交流群
          </span>
          <h2 id="community-modal-title">加入 AI 生产力 交流群</h2>
          <p className="community-modal__desc" id="community-modal-desc">
            扫描二维码加入交流，用 AI 释放你的生产力！
          </p>
        </div>

        <div className="community-modal__qr">
          <div className="community-modal__qr-grid" aria-label="交流群二维码">
            {/* 主二维码：放在左侧，作为默认入口。 */}
            <div className="community-modal__qr-card">
              <div className="community-modal__qr-frame">
                <img src={primaryQrUrl} alt="Skill Hub 交流群二维码（主）" loading="lazy" />
              </div>
              <span className="community-modal__qr-label">主群</span>
            </div>
            {/* 备用二维码：放在右侧，避免单一二维码失效。 */}
            <div className="community-modal__qr-card">
              <div className="community-modal__qr-frame community-modal__qr-frame--backup">
                <img src={backupQrUrl} alt="Skill Hub 交流群二维码（备用）" loading="lazy" />
              </div>
              <span className="community-modal__qr-label">备用</span>
            </div>
          </div>
          <span className="community-modal__qr-tip">使用微信扫一扫</span>
        </div>

        <div className="community-modal__topics" aria-label="群内交流话题">
          <span className="community-modal__topic">AI释放生产力</span>
          <span className="community-modal__topic">实战落地经验</span>
          <span className="community-modal__topic">新工具速览</span>
        </div>

        {/* 交互收敛：二维码扫码为主，不再提供“无法扫码”按钮。 */}
      </div>
    </div>,
    document.body
  );
}
