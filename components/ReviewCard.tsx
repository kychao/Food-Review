"use client";

import { useState, useEffect, useRef } from "react";
import StarRating from "@/components/StarRating";

interface Props {
  id: string;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  likes: number;
  dislikes: number;
  createdAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewCard({
  id,
  rating,
  comment,
  imageUrl,
  likes: initialLikes,
  dislikes: initialDislikes,
  createdAt,
}: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [voting, setVoting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    // Move focus to close button when lightbox opens
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxOpen]);

  async function handleVote(vote: "like" | "dislike") {
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/reviews/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        // Toggle off if same vote, otherwise set new vote
        setUserVote((prev) => (prev === vote ? null : vote));
      }
    } finally {
      setVoting(false);
    }
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <StarRating rating={rating} size="sm" />
        <time dateTime={createdAt} className="text-xs text-gray-400">
          {formatDate(createdAt)}
        </time>
      </div>

      {comment && (
        <p className="mt-2 text-sm leading-relaxed text-gray-700">{comment}</p>
      )}

      {imageUrl && (
        <div className="mt-3 overflow-hidden rounded-lg">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full focus:outline-none focus:ring-2 focus:ring-green-500/40"
            aria-label="View full image"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Review photo"
              className="w-full h-48 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
            />
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Full size image"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            ref={closeBtnRef}
            className="absolute top-4 right-4 text-white text-2xl leading-none hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/60 rounded"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image"
          >
            ✕
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Review photo full size"
              className="rounded-xl object-contain shadow-2xl"
              style={{ maxWidth: "600px", maxHeight: "75vh" }}
            />
          </div>
        </div>
      )}

      {/* Like / dislike */}
      <div className="mt-3 flex items-center gap-3" aria-label="Review votes">
        <button
          onClick={() => handleVote("like")}
          disabled={voting}
          aria-label={`Like this review. ${likes} likes.`}
          aria-pressed={userVote === "like"}
          aria-busy={voting}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${
            userVote === "like"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
          }`}
        >
          👍 {likes}
        </button>
        <button
          onClick={() => handleVote("dislike")}
          disabled={voting}
          aria-label={`Dislike this review. ${dislikes} dislikes.`}
          aria-pressed={userVote === "dislike"}
          aria-busy={voting}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${
            userVote === "dislike"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700"
          }`}
        >
          👎 {dislikes}
        </button>
      </div>
    </article>
  );
}
