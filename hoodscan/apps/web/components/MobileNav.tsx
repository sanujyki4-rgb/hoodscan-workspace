"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "./SearchBar";

interface NavLink {
  href: string;
  label: string;
}

/**
 * Hamburger trigger + dropdown panel, shown only below the `md`
 * breakpoint where the header's inline nav/search are hidden. Lives
 * inside <header>, which is `sticky` (a valid positioning context),
 * so the panel's `absolute inset-x-0 top-full` anchors correctly
 * without any extra wrapper.
 */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-ink transition hover:border-lime"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          {open ? (
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-base px-8 py-5 shadow-lg sm:px-12">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
            {!isHome && <SearchBar />}
            <nav className="flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium uppercase tracking-wide text-muted transition hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
