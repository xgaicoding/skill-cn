type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * 外部请求加载态：
   * - true 时展示按钮过渡态，并暂时禁止重复点击
   */
  loading?: boolean;
};

export default function Pagination({ page, totalPages, onPageChange, loading = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10);
  // 保证布尔值稳定，便于 JSX 中复用。
  const isLoading = Boolean(loading);

  return (
    <div className="pagination" role="navigation" aria-label="分页">
      <button
        className="pagination__btn"
        type="button"
        disabled={page <= 1 || isLoading}
        onClick={() => onPageChange(Math.max(page - 1, 1))}
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`pagination__btn ${p === page ? "is-active" : ""}`}
          type="button"
          onClick={() => onPageChange(p)}
          // 当前页即为“正在请求”的目标页，强调这个按钮即可。
          data-loading={isLoading && p === page}
          aria-busy={isLoading && p === page}
          disabled={isLoading}
        >
          {p}
        </button>
      ))}
      <button
        className="pagination__btn"
        type="button"
        disabled={page >= totalPages || isLoading}
        onClick={() => onPageChange(Math.min(page + 1, totalPages))}
      >
        Next
      </button>
    </div>
  );
}
