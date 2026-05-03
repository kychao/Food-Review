"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import ReviewCard from "@/components/ReviewCard";
import EmptyState from "@/components/EmptyState";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  likes: number;
  dislikes: number;
  createdAt: string;
}

interface Props {
  itemId: string;
  initialReviews: Review[];
}

export default function ReviewsSection({ itemId, initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  function handleReviewAdded(review: Review) {
    setReviews((prev) => [review, ...prev]);
  }

  return (
    <div className="flex flex-col gap-6">
      <ReviewForm itemId={itemId} onReviewAdded={handleReviewAdded} />

      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-lg font-semibold text-gray-800 mb-4">
          Reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <EmptyState message="No reviews yet. Be the first to leave one!" />
        ) : (
          <ul className="flex flex-col gap-3" role="list">
            {reviews.map((r) => (
              <li key={r.id}>
                <ReviewCard
                  id={r.id}
                  rating={r.rating}
                  comment={r.comment}
                  imageUrl={r.imageUrl}
                  likes={r.likes}
                  dislikes={r.dislikes}
                  createdAt={r.createdAt}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
