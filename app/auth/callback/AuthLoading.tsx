/**
 * AuthLoading（登录回调加载态）
 * --------------------------------
 * 该组件用于 OAuth 回调期间的视觉占位：
 * - 统一 page/fallback 的展示，避免重复 JSX
 * - 采用更简洁的品牌提示 + 微动效点阵，避免“用力过猛”
 * - 动效仅使用 transform / opacity，保证轻量与性能稳定
 */
export default function AuthLoading() {
  return (
    <div className="page auth-loading-page">
      {/* 居中承载区：保证在不同视口下都能形成明确的视觉焦点 */}
      <div className="auth-loading" role="status" aria-live="polite" aria-label="正在完成登录">
        {/* 轻量卡片：保持克制，突出“正在处理”的状态 */}
        <div className="auth-loading__card">
          {/* 品牌标识：仅保留文字，避免意义不明的装饰 */}
          <div className="auth-loading__brand">
            <span className="auth-loading__brand-text">Skill Hub</span>
          </div>

          {/* 状态文案：一句话即可 */}
          <div className="auth-loading__title">正在完成登录</div>

          {/* 微动效点阵：简洁、轻量、不抢注意力 */}
          <div className="auth-loading__dots" aria-hidden="true">
            <span className="auth-loading__dot" />
            <span className="auth-loading__dot" />
            <span className="auth-loading__dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
