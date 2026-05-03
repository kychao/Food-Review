"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import FlavorSlider from "@/components/FlavorSlider";
import StarRating from "@/components/StarRating";
import {
  updateCraving,
  shouldEndSession,
  pickNextItem,
  buildScoredItems,
  type FlavorVector,
  type ScoredItem,
  type SwipeResponse,
  type SwipeHistoryEntry,
} from "@/lib/flavorEngine";

type Phase = "setup" | "swiping" | "results";

export default function CravingsPage() {
  const [phase, setPhase] = useState<Phase>("setup");

  // ── Setup ──
  const [savorySweetness, setSavorySweetness] = useState(50);
  const [healthIndulgence, setHealthIndulgence] = useState(50);
  const [lightHeaviness, setLightHeaviness] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Session state ──
  const [allItems, setAllItems] = useState<ScoredItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ScoredItem | null>(null);
  const [craving, setCraving] = useState<FlavorVector>({ savorySweetness: 50, healthIndulgence: 50, lightHeaviness: 50 });
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<SwipeHistoryEntry[]>([]);
  const [yeses, setYeses] = useState<ScoredItem[]>([]);
  const [maybes, setMaybes] = useState<ScoredItem[]>([]);
  const [animating, setAnimating] = useState<SwipeResponse | null>(null);

  async function handleStart() {
    setLoading(true);
    setError("");
    const initialCraving: FlavorVector = { savorySweetness, healthIndulgence, lightHeaviness };
    try {
      const res = await fetch("/api/cravings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialCraving),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Build scored items client-side so we can re-score dynamically
      const scored = buildScoredItems(initialCraving, data);
      setAllItems(scored);
      setCraving(initialCraving);
      setSeenIds(new Set());
      setHistory([]);
      setYeses([]);
      setMaybes([]);

      // Pick the first item (highest match score)
      const first = scored.sort((a, b) => b.matchScore - a.matchScore)[0] ?? null;
      setCurrentItem(first);
      setPhase("swiping");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleSwipe = useCallback(
    (response: SwipeResponse) => {
      if (!currentItem || animating) return;

      setAnimating(response);

      setTimeout(() => {
        setAnimating(null);

        // 1. Record history
        const entry: SwipeHistoryEntry = {
          itemId: currentItem.id,
          response,
          flavor: currentItem.flavor,
        };
        const newHistory = [...history, entry];
        setHistory(newHistory);

        // 2. Update seen set
        const newSeen = new Set(seenIds);
        newSeen.add(currentItem.id);
        setSeenIds(newSeen);

        // 3. Track yes/maybe
        if (response === "yes") setYeses((p) => [...p, currentItem]);
        if (response === "maybe") setMaybes((p) => [...p, currentItem]);

        // 4. Adaptively update craving vector
        const newCraving = updateCraving(craving, currentItem.flavor, response);
        setCraving(newCraving);

        // 5. Check if session should end
        const remaining = allItems.length - newSeen.size;
        if (shouldEndSession(newHistory, remaining)) {
          setPhase("results");
          return;
        }

        // 6. Pick next best item based on updated craving
        const next = pickNextItem(newCraving, allItems, newSeen);
        setCurrentItem(next);
        if (!next) setPhase("results");
      }, 320);
    },
    [currentItem, animating, history, seenIds, craving, allItems]
  );

  function handleReset() {
    setPhase("setup");
    setAllItems([]);
    setCurrentItem(null);
    setHistory([]);
    setYeses([]);
    setMaybes([]);
    setSeenIds(new Set());
  }

  // ── Setup phase ────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">🍽️ What are you craving?</h1>
          <p className="mt-2 text-sm text-gray-500">
            Set your mood with the sliders, then swipe through options. The more you swipe, the smarter it gets.
          </p>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <FlavorSlider id="craving-ss" leftLabel="Savory" rightLabel="Sweet"
            value={savorySweetness} onChange={setSavorySweetness} />
          <FlavorSlider id="craving-hi" leftLabel="Healthy" rightLabel="Indulgent"
            value={healthIndulgence} onChange={setHealthIndulgence} />
          <FlavorSlider id="craving-lh" leftLabel="Light" rightLabel="Heavy"
            value={lightHeaviness} onChange={setLightHeaviness} />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button onClick={handleStart} disabled={loading}
          className="w-full rounded-full bg-green-600 py-3 text-base font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50">
          {loading ? "Finding matches…" : "Find My Match 🔍"}
        </button>
      </div>
    );
  }

  // ── Swiping phase ──────────────────────────────────────────────────────────
  if (phase === "swiping" && currentItem) {
    const yesCount = yeses.length;
    const swipeCount = history.length;

    const animClass =
      animating === "yes" ? "translate-x-20 rotate-6 opacity-0" :
      animating === "nope" ? "-translate-x-20 -rotate-6 opacity-0" :
      animating === "maybe" ? "scale-95 opacity-0" : "";

    return (
      <div className="mx-auto flex max-w-sm flex-col gap-5">
        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{swipeCount} swiped</span>
          <span className="font-medium text-green-600">{yesCount} 🔥 yes{yesCount !== 1 ? "es" : ""}</span>
          <span>{allItems.length - seenIds.size} left</span>
        </div>

        {/* Card */}
        <div className={`rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden transition-all duration-300 ${animClass}`}>
          {currentItem.topImage ? (
            <div className="h-52 w-full overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentItem.topImage} alt={currentItem.name}
                className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-6xl">
              🍽️
            </div>
          )}

          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-900">{currentItem.name}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{currentItem.restaurantName}</p>

            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={Math.round(currentItem.averageRating)} size="sm" />
              {currentItem.reviewCount > 0 ? (
                <span className="text-xs text-gray-500">
                  {currentItem.averageRating.toFixed(1)} · {currentItem.reviewCount} reviews
                </span>
              ) : (
                <span className="text-xs text-gray-400">No reviews yet</span>
              )}
            </div>

            {/* Live match score */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Current match</span>
                <span className="font-medium text-green-600">{Math.round(currentItem.matchScore)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-green-400 transition-all"
                  style={{ width: `${currentItem.matchScore}%` }} />
              </div>
            </div>

            {/* Top reviews */}
            {currentItem.topReviews && currentItem.topReviews.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs font-medium text-gray-500">What people are saying</p>
                {currentItem.topReviews.map((r) => (
                  <div key={r.id} className="rounded-xl bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <StarRating rating={r.rating} size="sm" />
                      <span className="text-xs text-gray-400">👍 {r.likes}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swipe buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => handleSwipe("nope")}
            className="flex flex-col items-center gap-1 rounded-2xl border border-red-200 bg-red-50 py-4 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400/40"
            aria-label="Not craving this">
            <span className="text-2xl">❌</span>
            <span className="text-xs font-medium">Nope</span>
          </button>
          <button onClick={() => handleSwipe("maybe")}
            className="flex flex-col items-center gap-1 rounded-2xl border border-yellow-200 bg-yellow-50 py-4 text-yellow-700 transition-colors hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
            aria-label="Could go for it">
            <span className="text-2xl">🤔</span>
            <span className="text-xs font-medium">Maybe</span>
          </button>
          <button onClick={() => handleSwipe("yes")}
            className="flex flex-col items-center gap-1 rounded-2xl border border-green-200 bg-green-50 py-4 text-green-700 transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400/40"
            aria-label="Yes I want this">
            <span className="text-2xl">🔥</span>
            <span className="text-xs font-medium">Yes!</span>
          </button>
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <button onClick={() => setPhase("results")} className="hover:text-gray-600 underline">
            See results now
          </button>
          <button onClick={handleReset} className="hover:text-gray-600 underline">
            Start over
          </button>
        </div>
      </div>
    );
  }

  // ── Results phase ──────────────────────────────────────────────────────────
  const finalList = [...yeses, ...maybes];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {yeses.length > 0 ? "Here's what you're craving 🎉" : "Your maybe list 🤔"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {finalList.length === 0
            ? "Nothing caught your eye. Try adjusting your sliders!"
            : `${yeses.length} yes${yeses.length !== 1 ? "es" : ""} · ${maybes.length} maybe${maybes.length !== 1 ? "s" : ""} · ${history.length} swiped`}
        </p>
      </div>

      {finalList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-400">
          Nothing matched. Try different sliders!
        </div>
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {yeses.map((item) => (
            <ResultCard key={item.id} item={item} tag="🔥 Craving this" tagColor="green" />
          ))}
          {maybes.map((item) => (
            <ResultCard key={item.id} item={item} tag="🤔 Could go for it" tagColor="yellow" />
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <button onClick={handleReset}
          className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Try again
        </button>
        <Link href="/"
          className="flex-1 rounded-full bg-green-600 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700">
          Browse restaurants
        </Link>
      </div>
    </div>
  );
}

function ResultCard({ item, tag, tagColor }: {
  item: ScoredItem;
  tag: string;
  tagColor: "green" | "yellow";
}) {
  return (
    <li>
      <Link href={`/restaurants/${item.restaurantId}/items/${item.id}`}
        className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/40">
        {item.topImage ? (
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.topImage} alt={item.name}
              className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-green-50 text-3xl">
            🍽️
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`text-xs font-medium ${tagColor === "green" ? "text-green-600" : "text-yellow-600"}`}>
            {tag}
          </span>
          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.restaurantName}</p>
          <div className="flex items-center gap-1.5">
            <StarRating rating={Math.round(item.averageRating)} size="sm" />
            <span className="text-xs text-gray-400">{Math.round(item.matchScore)}% match</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
