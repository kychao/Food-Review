"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import EmptyState from "@/components/EmptyState";

interface RestaurantResult {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
}

interface MenuItemResult {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  reviewCount: number;
  averageRating: number;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [restaurants, setRestaurants] = useState<RestaurantResult[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!q.trim()) {
      setRestaurants([]);
      setMenuItems([]);
      return;
    }
    setLoading(true);
    setError("");
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setRestaurants(data.restaurants ?? []);
        setMenuItems(data.menuItems ?? []);
      })
      .catch(() => setError("Search failed. Please try again."))
      .finally(() => setLoading(false));
  }, [q]);

  const total = restaurants.length + menuItems.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {q ? `Results for "${q}"` : "Search"}
        </h1>
        {!loading && q && (
          <p className="mt-1 text-sm text-gray-500">
            {total === 0
              ? "No results found."
              : `${total} result${total !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <span className="text-sm text-gray-400">Searching…</span>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && q && total === 0 && (
        <EmptyState message={`No restaurants or menu items match "${q}".`} />
      )}

      {!loading && !q && (
        <EmptyState message="Type something in the search bar above to get started." />
      )}

      {/* Restaurants */}
      {restaurants.length > 0 && (
        <section aria-labelledby="restaurants-heading">
          <h2 id="restaurants-heading" className="mb-3 text-lg font-semibold text-gray-800">
            Restaurants
          </h2>
          <ul className="flex flex-col gap-3" role="list">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/restaurants/${r.id}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    {r.description && (
                      <p className="mt-0.5 text-sm text-gray-500">{r.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    {r.itemCount} {r.itemCount === 1 ? "item" : "items"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Menu items */}
      {menuItems.length > 0 && (
        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="mb-3 text-lg font-semibold text-gray-800">
            Menu Items
          </h2>
          <ul className="flex flex-col gap-3" role="list">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/restaurants/${item.restaurantId}/items/${item.id}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.restaurantName}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(item.averageRating)} size="sm" />
                      {item.reviewCount > 0 ? (
                        <span className="text-xs text-gray-500">
                          {item.averageRating.toFixed(1)} · {item.reviewCount}{" "}
                          {item.reviewCount === 1 ? "review" : "reviews"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No reviews yet</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-green-600">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-gray-400">Loading…</div>}>
      <SearchResults />
    </Suspense>
  );
}
