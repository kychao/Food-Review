import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import SearchBar from "@/components/SearchBar";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SLO Bites — Cal Poly Campus Dining Reviews",
  description: "Browse and review menu items at Cal Poly dining restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`} style={{ colorScheme: "light" }}>
      <body className="flex min-h-full flex-col bg-gray-50 font-sans text-gray-900">
        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="shrink-0 flex items-center hover:opacity-80 transition-opacity"
              aria-label="SLO Bites home"
            >
              <Image
                src="/slo_bites_logo.png"
                alt="SLO Bites logo"
                width={180}
                height={72}
                className="object-contain"
              />
            </Link>
            <div className="flex flex-1 justify-center">
              <Suspense fallback={null}>
                <SearchBar />
              </Suspense>
            </div>
            <Link
              href="/feed"
              className="shrink-0 text-sm font-medium text-gray-600 hover:text-green-700"
            >
              Feed
            </Link>
            <Link
              href="/cravings"
              className="shrink-0 text-sm font-medium text-gray-600 hover:text-green-700"
            >
              🍽️ Cravings
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
          SLO Bites · Cal Poly Campus Dining Reviews · Built at KiroHacks 2025
        </footer>
      </body>
    </html>
  );
}
