"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Newspaper } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/**
 * 首页模式切换（右侧吸附 Mode Dock）
 * ------------------------------------------------------------
 * PRD 约束：
 * - 纵向二选一（避免传统 switch 的"表单感"）
 * - 默认只展示图标；hover/聚焦时"展开显示文案"，减少纯图标带来的认知成本
 * - URL 需体现 mode=practices（可分享/刷新保持）
 *
 * 说明：
 * - 该组件只负责"视觉与交互反馈"，不直接操作 URL；
 * - 具体路由更新由父组件（HomePage）统一处理，避免状态分散。
 * 
 * v1.5.6 埋点：
 * - mode_switch：切换模式时触发
 */

export type HomeMode = "skills" | "practices";

type ModeDockProps = {
  mode: HomeMode;
  onChange: (mode: HomeMode) => void;
};

export default function ModeDock({ mode, onChange }: ModeDockProps) {
  /**
   * Dock 的"展开态"只用于信息表达（显示文案），不影响功能（点击图标也能切换）。
   *
   * 为什么不用纯 CSS :hover / :focus-within？
   * - :focus-within 在点击后会留下焦点，导致 Dock 可能"卡在展开态"
   * - 这里用轻量 state 来做「hover 展开 + 延迟收起」与「键盘聚焦展开」，
   *   交互更可控，也避免和实践卡片蒙层类似的"关不掉"问题。
   */
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dockTop, setDockTop] = useState<number | null>(null);

  const dockRef = useRef<HTMLDivElement | null>(null);

  const closeTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // 拖拽相关状态使用 ref（避免高频 pointermove 触发不必要的状态同步逻辑）。
  const pointerIdRef = useRef<number | null>(null);
  const pointerDownRef = useRef(false);
  const dragStartedRef = useRef(false);
  const blockClickRef = useRef(false);
  const startClientYRef = useRef(0);
  const startTopRef = useRef(0);
  const dockHeightRef = useRef(0);
  const prevBodyUserSelectRef = useRef<string | null>(null);
  const dragListenersRef = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
    cancel: (event: PointerEvent) => void;
  } | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const cleanupDragListeners = () => {
    const handlers = dragListenersRef.current;
    if (!handlers) {
      return;
    }

    // pointermove 需要 passive:false 才能在拖拽时 preventDefault（阻止滚动/默认手势）。
    window.removeEventListener("pointermove", handlers.move);
    window.removeEventListener("pointerup", handlers.up);
    window.removeEventListener("pointercancel", handlers.cancel);
    dragListenersRef.current = null;
  };

  const clearRaf = () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const openDock = () => {
    clearCloseTimer();
    setExpanded(true);
  };

  const closeDock = (delayMs = 240) => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setExpanded(false);
      closeTimerRef.current = null;
    }, delayMs);
  };

  const clampDockTop = (top: number, dockHeight: number) => {
    // 预留一点上下安全边距，避免 Dock 贴边显得拥挤，也防止被浏览器 UI 遮挡。
    const SAFE_PADDING = 12;
    return Math.min(Math.max(top, SAFE_PADDING), window.innerHeight - dockHeight - SAFE_PADDING);
  };

  useEffect(() => {
    /**
     * 「首次进入首页」引导：先展开，再自动收起。
     * ------------------------------------------------------------
     * 用户反馈：首次进入页面时，希望用户能"看见"这是一个可切换模式的控件，
     * 但又不希望它一直占据视觉注意力，所以采用"短暂展开 → 自动收起"的方式。
     *
     * 关键点：
     * - 只在"用户第一次进入站点首页"触发（用 localStorage 记一次性标记）
     * - 用 closeTimerRef 复用现有 close 逻辑：如果用户在引导期间 hover/focus，
     *   openDock() 会清掉 timer，避免出现"我正在操作却被强制收起"的割裂体验。
     */
    const INTRO_SEEN_KEY = "skillhub_mode_dock_intro_seen_v1";

    try {
      // prefers-reduced-motion 用户不做"自动展开/收起"，避免造成不适。
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const hasSeen = window.localStorage.getItem(INTRO_SEEN_KEY) === "1";

      if (!prefersReducedMotion && !hasSeen) {
        window.localStorage.setItem(INTRO_SEEN_KEY, "1");
        openDock();
        // 展开停留一小段时间，给用户完成识别；随后自动收起。
        closeDock(1400);
      }
    } catch {
      // 隐私模式/禁用存储等场景可能抛错：忽略即可，不影响功能。
    }

    // 组件卸载时清理 timer，避免潜在的 setState on unmounted 。
    return () => {
      clearCloseTimer();
      clearRaf();
      cleanupDragListeners();
    };
  }, []);

  useEffect(() => {
    /**
     * 位置初始化（可拖拽 + 吸附右侧）
     * ------------------------------------------------------------
     * 用户诉求：
     * - 初始位置比垂直居中更靠下一点
     * - 支持拖拽调整位置（仅 Y 轴），但始终吸附在右侧（X 轴不变）
     *
     * 实现要点：
     * - 用 localStorage 保存 top(px)，刷新后保持用户习惯
     * - 首次无缓存时：用 viewport 高度 * 58% 作为"视觉重心"，再减去半个 Dock 高度
     *   （与 CSS 的 top:58% + translateY(-50%) 保持一致，避免首屏跳动）
     * - 监听 resize，确保 Dock 始终在可视区域内
     */
    const POSITION_KEY = "skillhub_mode_dock_top_v1";

    try {
      const dockEl = dockRef.current;
      const measuredHeight = dockEl?.getBoundingClientRect().height || 106;
      dockHeightRef.current = measuredHeight;

      const saved = window.localStorage.getItem(POSITION_KEY);
      const defaultTop = window.innerHeight * 0.58 - measuredHeight / 2;
      const nextTop = clampDockTop(saved ? Number(saved) : defaultTop, measuredHeight);
      setDockTop(nextTop);

      const onResize = () => {
        const height = dockRef.current?.getBoundingClientRect().height || dockHeightRef.current || 106;
        dockHeightRef.current = height;
        setDockTop((prev) => {
          const fallbackTop = window.innerHeight * 0.58 - height / 2;
          const currentTop = typeof prev === "number" ? prev : fallbackTop;
          return clampDockTop(currentTop, height);
        });
      };

      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    } catch {
      // localStorage 不可用 / 读写报错时：不影响功能，直接使用 CSS 默认定位即可。
      return;
    }
  }, []);

  const setDockTopRaf = (nextTop: number) => {
    // 用 rAF 合并高频 pointermove 更新，避免 setState 过于频繁。
    clearRaf();
    rafRef.current = window.requestAnimationFrame(() => {
      setDockTop(nextTop);
      rafRef.current = null;
    });
  };

  return (
    <div
      ref={dockRef}
      className="mode-dock"
      aria-label="首页模式切换（右侧吸附）"
      data-mode={mode}
      data-expanded={expanded ? "true" : "false"}
      data-dragging={dragging ? "true" : "false"}
      style={
        typeof dockTop === "number"
          ? {
              // 使用 px top 便于拖拽；同时把 CSS 的 translateY(-50%) 去掉（我们已在数值里扣掉半高）。
              top: dockTop,
              transform: "translate3d(0, 0, 0)",
            }
          : undefined
      }
      onMouseEnter={() => {
        if (dragging) {
          return;
        }
        openDock();
      }}
      onMouseLeave={() => {
        if (dragging) {
          return;
        }
        closeDock(260);
      }}
      onFocusCapture={() => {
        if (dragging) {
          return;
        }
        openDock();
      }}
      onBlurCapture={(event) => {
        // 仅当焦点完全离开 Dock 时才收起，避免在两个按钮之间切换时抖动。
        const next = event.relatedTarget as Node | null;
        if (next && event.currentTarget.contains(next)) {
          return;
        }
        closeDock(0);
      }}
      onPointerDown={(event) => {
        // 仅处理鼠标主键/触摸；右键不触发拖拽。
        if (typeof event.button === "number" && event.button !== 0) {
          return;
        }

        // 记录 pointerId：用于在 window 级别的 pointermove/up 中只响应"本次按下"的那根指针，
        // 避免多指触控/其他指针事件干扰。
        pointerIdRef.current = event.pointerId;

        // 记录拖拽起点：在 pointermove 中根据 deltaY 更新 top。
        pointerDownRef.current = true;
        dragStartedRef.current = false;
        blockClickRef.current = false;
        startClientYRef.current = event.clientY;

        // 当前 top(px)：优先使用已初始化的 dockTop，否则用 DOM 实测位置兜底。
        const rect = dockRef.current?.getBoundingClientRect();
        startTopRef.current = typeof dockTop === "number" ? dockTop : rect?.top ?? 0;

        // 记录高度用于 clamp；未拿到时用经验值兜底。
        dockHeightRef.current = rect?.height ?? dockHeightRef.current ?? 106;

        /**
         * 关键实现：用 window 级别的 pointermove/up 监听来做拖拽
         * ------------------------------------------------------------
         * 原因：
         * - 如果用 setPointerCapture，会影响按钮 click（用户反馈"点不了了"）
         * - 如果只监听组件自身的 onPointerMove，指针一旦移出 Dock 就收不到 move（拖拽不稳）
         *
         * window 监听方案既能保证"拖拽稳定"，也不会破坏 button 的正常 click。
         */
        cleanupDragListeners();

        const handleMove = (moveEvent: PointerEvent) => {
          // 只处理本次 pointerdown 对应的指针，避免多指/其他指针干扰。
          if (!pointerDownRef.current || pointerIdRef.current !== moveEvent.pointerId) {
            return;
          }

          const deltaY = moveEvent.clientY - startClientYRef.current;

          // 移动超过阈值才认为是拖拽，避免"轻点一下"也被当作拖动导致按钮点不动。
          const DRAG_THRESHOLD = 6;
          if (!dragStartedRef.current && Math.abs(deltaY) >= DRAG_THRESHOLD) {
            dragStartedRef.current = true;
            blockClickRef.current = true;
            setDragging(true);

            // 防止拖动时选中文字/触发浏览器默认手势。
            prevBodyUserSelectRef.current = document.body.style.userSelect;
            document.body.style.userSelect = "none";
          }

          if (!dragStartedRef.current) {
            return;
          }

          // 仅沿 Y 轴移动；X 轴始终由 CSS right 固定，实现"吸附右侧"。
          const rawTop = startTopRef.current + deltaY;
          const nextTop = clampDockTop(rawTop, dockHeightRef.current);
          setDockTopRaf(nextTop);

          // 阻止默认行为，避免在触摸设备上触发滚动等手势。
          moveEvent.preventDefault();
        };

        const handleUp = (upEvent: PointerEvent) => {
          if (pointerIdRef.current !== upEvent.pointerId) {
            return;
          }

          pointerDownRef.current = false;
          pointerIdRef.current = null;
          cleanupDragListeners();

          // 拖拽结束：恢复 user-select，并持久化位置。
          if (dragStartedRef.current) {
            dragStartedRef.current = false;
            setDragging(false);

            if (prevBodyUserSelectRef.current !== null) {
              document.body.style.userSelect = prevBodyUserSelectRef.current;
              prevBodyUserSelectRef.current = null;
            }

            // pointerup 时 setState 可能还没来得及 flush，这里用 upEvent 的坐标算出最终 top。
            const deltaY = upEvent.clientY - startClientYRef.current;
            const rawTop = startTopRef.current + deltaY;
            const finalTop = clampDockTop(rawTop, dockHeightRef.current);

            // 结束时强制把位置同步到 state（避免 rAF 里残留的更新造成"回弹"）。
            clearRaf();
            setDockTop(finalTop);

            try {
              const POSITION_KEY = "skillhub_mode_dock_top_v1";
              window.localStorage.setItem(POSITION_KEY, String(finalTop));
            } catch {
              // 忽略存储失败
            }

            /**
             * 阻止"拖拽后松手触发 click"：
             * - 浏览器可能在 pointerup 后补发 click（尤其当起点在 button 上时）
             * - 这里用一次性标记在同一事件循环内屏蔽按钮 onClick
             */
            blockClickRef.current = true;
            window.setTimeout(() => {
              blockClickRef.current = false;
            }, 0);
          }
        };

        const handleCancel = (cancelEvent: PointerEvent) => {
          if (pointerIdRef.current !== cancelEvent.pointerId) {
            return;
          }

          pointerDownRef.current = false;
          dragStartedRef.current = false;
          pointerIdRef.current = null;
          cleanupDragListeners();
          clearRaf();
          setDragging(false);

          if (prevBodyUserSelectRef.current !== null) {
            document.body.style.userSelect = prevBodyUserSelectRef.current;
            prevBodyUserSelectRef.current = null;
          }
        };

        dragListenersRef.current = {
          move: handleMove,
          up: handleUp,
          cancel: handleCancel,
        };

        // passive:false 让我们在拖拽时可以 preventDefault（避免滚动/默认手势）
        window.addEventListener("pointermove", handleMove, { passive: false });
        window.addEventListener("pointerup", handleUp);
        window.addEventListener("pointercancel", handleCancel);
      }}
    >
      {/* 液晶滑块：由 data-mode 驱动 translateY（CSS 里控制），同时跟随展开态变宽 */}
      <span className="mode-dock__thumb" aria-hidden="true" />

      <button
        type="button"
        className={`mode-dock__item ${mode === "practices" ? "is-active" : ""}`}
        aria-label="切换到看案例"
        aria-pressed={mode === "practices"}
        onClick={() => {
          if (blockClickRef.current) {
            return;
          }
          // 埋点：模式切换
          trackEvent("mode_switch", {
            from: mode,
            to: "practices",
          });
          // 点击后立即收起：减少视觉干扰，同时避免键盘焦点导致长期展开。
          setExpanded(false);
          onChange("practices");
        }}
      >
        <span className="mode-dock__icon" aria-hidden="true">
          <Newspaper />
        </span>
        <span className="mode-dock__label">看案例</span>
      </button>

      <button
        type="button"
        className={`mode-dock__item ${mode === "skills" ? "is-active" : ""}`}
        aria-label="切换到找工具"
        aria-pressed={mode === "skills"}
        onClick={() => {
          if (blockClickRef.current) {
            return;
          }
          // 埋点：模式切换
          trackEvent("mode_switch", {
            from: mode,
            to: "skills",
          });
          setExpanded(false);
          onChange("skills");
        }}
      >
        <span className="mode-dock__icon" aria-hidden="true">
          <LayoutGrid />
        </span>
        <span className="mode-dock__label">找工具</span>
      </button>
    </div>
  );
}
