"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full max-w-md">
      <label htmlFor="search-input" className="sr-only">
        Search restaurants and menu items
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search restaurants or menu items…"
        className="flex-1 rounded-l-full border border-r-0 border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
        aria-label="Search restaurants and menu items"
      />
      <button
        type="submit"
        className="rounded-r-full border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/30"
        aria-label="Submit search"
      >
        Search
      </button>
    </form>
  );
}
