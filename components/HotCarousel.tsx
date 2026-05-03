"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import StarRating from "@/components/StarRating";

interface HotItem {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  averageRating: number;
  reviewCount: number;
  topImage: string;
}

interface Props {
  items: HotItem[];
}

export default function HotCarousel({ items }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((index: number, dir: "left" | "right") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActive(index);
      setAnimating(false);
    }, 400);
  }, [animating]);

  const prev = useCallback(() => {
    goTo((active - 1 + items.length) % items.length, "left");
  }, [active, items.length, goTo]);

  const next = useCallback(() => {
    goTo((active + 1) % items.length, "right");
  }, [active, items.length, goTo]);

  // Auto-rotate every 4 seconds
  useEffect(() => {
    if (paused || items.length <= 1) return;
    const id = setInterval(() => {
      setDirection("right");
      setAnimating(true);
      setTimeout(() => {
        setActive((i) => (i + 1) % items.length);
        setAnimating(false);
      }, 400);
    }, 4000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  if (items.length === 0) return null;

  const prevIndex = (active - 1 + items.length) % items.length;
  const nextIndex = (active + 1) % items.length;

  return (
    <section
      aria-labelledby="hot-heading"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <h2 id="hot-heading" className="mb-4 text-xl font-semibold text-gray-800">
        🔥 Recently on Fire
      </h2>

      <div className="relative flex items-center justify-center overflow-hidden">
        {/* Prev button */}
        <button
          onClick={prev}
          aria-label="Previous item"
          className="absolute left-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40"
        >
          ‹
        </button>

        {/* Track */}
        <div className="relative flex w-full items-center justify-center gap-4 px-12">
          {/* Prev card */}
          <div
            className={`hidden sm:block w-44 shrink-0 transition-all duration-500 ease-in-out cursor-pointer
              ${animating && direction === "right" ? "opacity-0 -translate-x-8" : ""}
              ${animating && direction === "left" ? "opacity-100 translate-x-0" : ""}
              ${!animating ? "opacity-50 scale-90 hover:opacity-70" : ""}
            `}
            onClick={() => !animating && goTo(prevIndex, "left")}
          >
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-32 w-full bg-gray-100">
                <Image src={items[prevIndex].topImage} alt={items[prevIndex].name}
                  fill className="object-cover" sizes="176px" />
              </div>
              <div className="p-2 text-center">
                <p className="truncate text-xs font-medium text-gray-600">{items[prevIndex].name}</p>
              </div>
            </div>
          </div>

          {/* Center card */}
          <div
            className={`relative z-10 w-full max-w-xl shrink-0 transition-all duration-500 ease-in-out
              ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}
            `}
          >
            <Link
              href={`/restaurants/${items[active].restaurantId}/items/${items[active].id}`}
              className="block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500/40"
            >
              <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-100">
                <Image
                  src={items[active].topImage}
                  alt={items[active].name}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="672px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xl font-bold leading-tight drop-shadow">
                        {items[active].name}
                      </p>
                      <p className="text-sm text-white/80">{items[active].restaurantName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRating rating={Math.round(items[active].averageRating)} size="sm" />
                        <span className="text-xs text-white/70">
                          {items[active].averageRating.toFixed(1)} · {items[active].reviewCount}{" "}
                          {items[active].reviewCount === 1 ? "review" : "reviews"}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1 text-sm font-bold shadow">
                      🔥 Hot
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Next card */}
          <div
            className={`hidden sm:block w-44 shrink-0 transition-all duration-500 ease-in-out cursor-pointer
              ${animating && direction === "left" ? "opacity-0 translate-x-8" : ""}
              ${animating && direction === "right" ? "opacity-100 translate-x-0" : ""}
              ${!animating ? "opacity-50 scale-90 hover:opacity-70" : ""}
            `}
            onClick={() => !animating && goTo(nextIndex, "right")}
          >
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-32 w-full bg-gray-100">
                <Image src={items[nextIndex].topImage} alt={items[nextIndex].name}
                  fill className="object-cover" sizes="176px" />
              </div>
              <div className="p-2 text-center">
                <p className="truncate text-xs font-medium text-gray-600">{items[nextIndex].name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={next}
          aria-label="Next item"
          className="absolute right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40"
        >
          ›
        </button>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" role="tablist">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to item ${i + 1}`}
              onClick={() => goTo(i, i > active ? "right" : "left")}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-green-600" : "w-1.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
