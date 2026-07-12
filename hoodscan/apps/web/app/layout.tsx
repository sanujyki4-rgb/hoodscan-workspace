import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const dataFace = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-data",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "hoodscan — Robinhood Chain Explorer",
  description: "A block explorer for Robinhood Chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${dataFace.variable}`}>
      <body className="font-display">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <a href="/" className="flex items-center gap-2">
              <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
              <span className="text-lg font-bold tracking-tight">
                hoodscan
              </span>
            </a>
            <span className="text-xs text-muted">Robinhood Chain · 4663</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
