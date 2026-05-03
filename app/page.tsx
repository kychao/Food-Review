import { prisma } from "@/lib/prisma";
import RestaurantCard from "@/components/RestaurantCard";
import HotCarousel from "@/components/HotCarousel";
import StarRating from "@/components/StarRating";
import AddMenuItemHomeButton from "@/components/AddMenuItemHomeButton";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HomePage() {
  const [restaurants, recentReviews, allItems] = await Promise.all([
    prisma.restaurant.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { menuItems: true } } },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        menuItem: {
          include: { restaurant: { select: { id: true, name: true } } },
        },
      },
    }),
    // Fetch items that have at least one review with an image in the last 30 days
    prisma.menuItem.findMany({
      include: {
        restaurant: { select: { id: true, name: true } },
        reviews: {
          select: { rating: true, imageUrl: true, likes: true, dislikes: true, createdAt: true },
        },
      },
    }),
  ]);

  // Build "on fire" list:
  // - Must have at least one review with a photo
  // - Average rating >= 3.5 (lowered threshold to be more inclusive)
  // - Sort by: recency of latest high-rated review, then average rating
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const hotItems = allItems
    .map((item) => {
      const reviewsWithImages = item.reviews.filter((r) => r.imageUrl);
      if (reviewsWithImages.length === 0) return null;

      const avgRating =
        item.reviews.length > 0
          ? item.reviews.reduce((s, r) => s + r.rating, 0) / item.reviews.length
          : 0;

      if (avgRating < 3.5) return null;

      // Top image = most-liked review with image
      const topImageReview = reviewsWithImages
        .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))[0];

      return {
        id: item.id,
        name: item.name,
        restaurantId: item.restaurant.id,
        restaurantName: item.restaurant.name,
        averageRating: avgRating,
        reviewCount: item.reviews.length,
        topImage: topImageReview.imageUrl!,
        recentHighRated: item.reviews.some(
          (r) => r.rating >= 4 && new Date(r.createdAt) > thirtyDaysAgo
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Recent high-rated first, then by average rating
      if (a!.recentHighRated !== b!.recentHighRated)
        return a!.recentHighRated ? -1 : 1;
      return b!.averageRating - a!.averageRating;
    })
    .slice(0, 12) as {
      id: string;
      name: string;
      restaurantId: string;
      restaurantName: string;
      averageRating: number;
      reviewCount: number;
      topImage: string;
    }[];

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-4">
        <Image
          src="/slo_bites_logo.png"
          alt="SLO Bites — Cal Poly Campus Dining Reviews"
          width={560}
          height={560}
          priority
          className="drop-shadow-sm"
        />
        <p className="text-base text-gray-500 max-w-md">
          Find out what&apos;s good before you spend your dining dollars.
        </p>
      </section>

      {/* Cravings CTA */}
      <Link
        href="/cravings"
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5 shadow-md transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-green-400/50"
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4 text-white">
          <span className="text-4xl drop-shadow" aria-hidden="true">🤤</span>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight">
              Not sure what to eat?
            </h2>
            <p className="text-sm text-white/80">
              Tell us your craving and our AI will find your perfect match.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow transition-transform group-hover:scale-105">
            Find My Match →
          </span>
        </div>
      </Link>

      {/* Hot carousel — only shows when there are qualifying items */}
      {hotItems.length > 0 && <HotCarousel items={hotItems} />}

      {/* Restaurant grid */}
      <section aria-labelledby="restaurants-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="restaurants-heading" className="text-xl font-semibold text-gray-800">
            Dining Restaurants
          </h2>
          {restaurants.length > 0 && (
            <AddMenuItemHomeButton firstRestaurantId={restaurants[0].id} />
          )}
        </div>
        {restaurants.length === 0 ? (
          <p className="text-sm text-gray-500">No restaurants found.</p>
        ) : (
          <ul
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-label="List of dining restaurants"
          >
            {restaurants.map((r) => (
              <li key={r.id}>
                <RestaurantCard
                  id={r.id}
                  name={r.name}
                  description={r.description}
                  itemCount={r._count.menuItems}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent reviews */}
      <section aria-labelledby="recent-reviews-heading">
        <h2 id="recent-reviews-heading" className="mb-4 text-xl font-semibold text-gray-800">
          Recent Reviews
        </h2>

        {recentReviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet — be the first!</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3" role="list">
              {recentReviews.map((review) => (
                <li key={review.id}>
                  <Link
                    href={`/restaurants/${review.menuItem.restaurant.id}/items/${review.menuItemId}`}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/40"
                  >
                    {review.imageUrl ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={review.imageUrl}
                          alt={`Photo for ${review.menuItem.name}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                        🍽️
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {review.menuItem.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {review.menuItem.restaurant.name}
                          </p>
                        </div>
                        <time
                          dateTime={review.createdAt.toISOString()}
                          className="shrink-0 text-xs text-gray-400"
                        >
                          {formatDate(review.createdAt)}
                        </time>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      {review.comment && (
                        <p className="line-clamp-1 text-sm text-gray-600">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 text-center">
              <Link
                href="/feed"
                className="inline-block rounded-full border border-green-600 px-6 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
              >
                See all recent reviews →
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
