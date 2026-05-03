"use client";

import { useState } from "react";
import Image from "next/image";
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
          <Image
            src={imageUrl}
            alt="Review photo"
            width={600}
            height={300}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Like / dislike */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => handleVote("like")}
          disabled={voting}
          aria-label={`Like this review. ${likes} likes.`}
          aria-pressed={userVote === "like"}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40 ${
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
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 ${
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
