import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "../../i18n";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 25, 50];

function buildPageNumbers(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  if (page > 3) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const { t, language } = useTranslation();
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const navButton =
    "grid h-8 min-w-8 place-items-center border px-2 font-data text-[14px] transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35";
  const idleButton = `${navButton} border-ink-900/12 bg-cream-50 text-ink-600 hover:border-ink-900/30 hover:text-ink-900`;

  return (
    <div className="flex flex-col gap-3 border-t border-ink-900/12 bg-cream-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[14px] text-ink-500">
          {language === "en" ? (
            <>
              Showing <span className="font-semibold text-ink-800">{start}–{end}</span> of{" "}
              <span className="font-semibold text-ink-800">{total}</span> entries
            </>
          ) : (
            <>
              Menampilkan <span className="font-semibold text-ink-800">{start}–{end}</span> dari{" "}
              <span className="font-semibold text-ink-800">{total}</span> entri
            </>
          )}
        </p>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label={language === "en" ? "Rows per page" : "Baris per halaman"}
          className="h-8 border border-ink-900/12 bg-cream-50 px-2 font-data text-[14px] text-ink-600 outline-none transition focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} {language === "en" ? "/ page" : "/ halaman"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={idleButton}
          title={t("common.prev")}
        >
          <ChevronLeft size={14} />
        </button>

        {buildPageNumbers(page, totalPages).map((p, idx) =>
          p === "…" ? (
            <span key={`ellipsis-${idx}`} className="px-1 font-data text-[14px] text-ink-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={p === page ? `${navButton} border-ink-950 bg-ink-950 text-cream-50` : idleButton}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={idleButton}
          title={t("common.next")}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
