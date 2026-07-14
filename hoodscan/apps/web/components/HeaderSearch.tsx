"use client";

import { usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";

/**
 * Compact search shown in the header — hidden on the home page since
 * the hero there already has a full-size SearchBar right below the
 * header. Shows up on every other page instead.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  return (
    <div className="hidden max-w-xs flex-1 lg:block">
      <SearchBar compact />
    </div>
  );
}
