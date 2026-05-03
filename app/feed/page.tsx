import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function FeedPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      menuItem: {
        include: {
          restaurant: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recent Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          See what the Cal Poly community is eating right now.
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState message="No reviews yet. Be the first to leave one!" />
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {reviews.map((review) => (
            <li key={review.id}>
              <Link
                href={`/restaurants/${review.menuItem.restaurant.id}/items/${review.menuItemId}`}
                className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/40"
              >
                {review.imageUrl ? (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.imageUrl}
                      alt={`Photo for ${review.menuItem.name}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-green-50 text-3xl">
                    🍽️
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{review.menuItem.name}</p>
                      <p className="text-xs text-gray-500">{review.menuItem.restaurant.name}</p>
                    </div>
                    <time dateTime={review.createdAt.toISOString()} className="shrink-0 text-xs text-gray-400">
                      {formatDate(review.createdAt)}
                    </time>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.comment && (
                    <p className="line-clamp-2 text-sm text-gray-600">{review.comment}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>👍 {review.likes}</span>
                    <span>👎 {review.dislikes}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
