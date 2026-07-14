import Link from "next/link";

export function Pagination({
  basePath,
  page,
  limit,
  total,
}: {
  basePath: string;
  page: number;
  limit: number;
  total: number;
}) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <span className="text-xs text-muted">
        Page {page.toLocaleString()} of {totalPages.toLocaleString()} ·{" "}
        {total.toLocaleString()} total
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={hasPrev ? `${basePath}?page=${page - 1}` : "#"}
          aria-disabled={!hasPrev}
          className={`rounded-lg border border-border px-3 py-1.5 text-xs font-medium ${
            hasPrev
              ? "text-ink hover:border-lime hover:text-lime"
              : "cursor-not-allowed text-muted/50"
          }`}
        >
          ← Prev
        </Link>
        <Link
          href={hasNext ? `${basePath}?page=${page + 1}` : "#"}
          aria-disabled={!hasNext}
          className={`rounded-lg border border-border px-3 py-1.5 text-xs font-medium ${
            hasNext
              ? "text-ink hover:border-lime hover:text-lime"
              : "cursor-not-allowed text-muted/50"
          }`}
        >
          Next →
        </Link>
      </div>
    </div>
  );
}
