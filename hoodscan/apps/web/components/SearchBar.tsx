"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Single search box that routes to the right page based on input shape:
 * - all digits            -> block number
 * - 0x + 64 hex chars      -> transaction hash
 * - 0x + 40 hex chars      -> address
 */
export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();

    if (/^\d+$/.test(q)) {
      router.push(`/block/${q}`);
    } else if (/^0x[0-9a-fA-F]{64}$/.test(q)) {
      router.push(`/tx/${q}`);
    } else if (/^0x[0-9a-fA-F]{40}$/.test(q)) {
      router.push(`/address/${q}`);
    } else {
      setError("Enter a block number, transaction hash, or address");
      return;
    }
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-3 focus-within:border-accent">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          placeholder="Search by block number, tx hash, or address"
          className="w-full bg-transparent font-mono text-sm text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-base transition hover:bg-accent-dim"
        >
          Search
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
