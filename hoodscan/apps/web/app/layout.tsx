import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${dataFace.variable}`}
    >
      <body className="flex min-h-screen flex-col font-display">
        <Providers>
          <Header />

          <main className="mx-auto w-full max-w-[1600px] flex-1 px-8 py-8 sm:px-12 lg:px-20">
            {children}
          </main>

          <Footer />
        </Providers>
      </body>
    </html>
  );
}
