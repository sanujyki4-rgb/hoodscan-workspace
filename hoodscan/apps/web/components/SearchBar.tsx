"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Filter = "all" | "block" | "tx" | "address";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All Filters" },
  { value: "block", label: "Block" },
  { value: "tx", label: "Transaction" },
  { value: "address", label: "Address" },
];

/**
 * Single search box that routes to the right page based on input shape:
 * - all digits            -> block number
 * - 0x + 64 hex chars      -> transaction hash
 * - 0x + 40 hex chars      -> address
 *
 * The full (non-compact) variant adds an Etherscan/BscScan-style
 * filter dropdown that narrows validation to one category instead of
 * relying purely on auto-detection.
 */
export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();

    const isBlock = /^\d+$/.test(q);
    const isTx = /^0x[0-9a-fA-F]{64}$/.test(q);
    const isAddress = /^0x[0-9a-fA-F]{40}$/.test(q);

    if (filter === "block") {
      if (!isBlock) return setError("Enter a valid block number");
      router.push(`/block/${q}`);
    } else if (filter === "tx") {
      if (!isTx) return setError("Enter a valid transaction hash (0x + 64 hex characters)");
      router.push(`/tx/${q}`);
    } else if (filter === "address") {
      if (!isAddress) return setError("Enter a valid address (0x + 40 hex characters)");
      router.push(`/address/${q}`);
    } else if (isBlock) {
      router.push(`/block/${q}`);
    } else if (isTx) {
      router.push(`/tx/${q}`);
    } else if (isAddress) {
      router.push(`/address/${q}`);
    } else {
      return setError("Enter a block number, transaction hash, or address");
    }
    setError(null);
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 transition hover:border-muted/50 focus-within:border-lime focus-within:ring-1 focus-within:ring-lime/30">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            placeholder="Search…"
            className="w-full bg-transparent font-mono text-xs text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
      </form>
    );
  }

  const currentFilterLabel = FILTERS.find((f) => f.value === filter)?.label ?? "All Filters";

  const placeholder =
    filter === "block"
      ? "Enter block number"
      : filter === "tx"
        ? "Enter transaction hash"
        : filter === "address"
          ? "Enter address"
          : "Block number, tx hash, or address";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-1 rounded-xl border-2 border-border bg-surface py-1.5 pl-2 pr-2 shadow-sm">
        <div ref={filterRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted outline-none transition hover:bg-base hover:text-ink"
          >
            {currentFilterLabel}
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              className={`shrink-0 transition-transform ${filterOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => {
                    setFilter(f.value);
                    setFilterOpen(false);
                    setError(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-lime-bright/10 ${
                    filter === f.value ? "text-lime" : "text-ink"
                  }`}
                >
                  {f.label}
                  {filter === f.value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="h-5 w-px shrink-0 bg-border" />

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          className="w-full min-w-0 bg-transparent py-1.5 pl-3 font-mono text-sm text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex shrink-0 items-center justify-center rounded-lg bg-lime-bright p-2 text-black outline-none transition hover:bg-lime-bright-dark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </form>
  );
}
