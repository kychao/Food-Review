import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StarRating from "@/components/StarRating";
import ReviewsSection from "@/components/ReviewsSection";
import FlavorProfile from "@/components/FlavorProfile";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ restaurantId: string; itemId: string }>;
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

export default async function MenuItemPage({ params }: Props) {
  const { restaurantId, itemId } = await params;

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: {
      restaurant: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!item || item.restaurantId !== restaurantId) notFound();

  const averageRating =
    item.reviews.length > 0
      ? item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length
      : 0;

  // Averaged flavor profile across all reviews that answered each slider
  const flavorProfile = {
    savorySweetness: avg(item.reviews.map((r) => r.savorySweetness)),
    healthIndulgence: avg(item.reviews.map((r) => r.healthIndulgence)),
    lightHeaviness: avg(item.reviews.map((r) => r.lightHeaviness)),
  };

  const initialReviews = item.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    imageUrl: r.imageUrl,
    likes: r.likes,
    dislikes: r.dislikes,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span className="mx-2" aria-hidden="true">›</span>
        <Link href={`/restaurants/${restaurantId}`} className="hover:text-green-700">
          {item.restaurant.name}
        </Link>
        <span className="mx-2" aria-hidden="true">›</span>
        <span className="font-medium text-gray-900">{item.name}</span>
      </nav>

      {/* Item header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{item.restaurant.name}</p>
        {item.description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <StarRating rating={Math.round(averageRating)} size="md" />
          {item.reviews.length > 0 ? (
            <span className="text-sm text-gray-600">
              {averageRating.toFixed(1)} · {item.reviews.length}{" "}
              {item.reviews.length === 1 ? "review" : "reviews"}
            </span>
          ) : (
            <span className="text-sm text-gray-400">No reviews yet</span>
          )}
        </div>
      </div>

      {/* Flavor profile — only shows once at least one review has slider data */}
      <FlavorProfile
        savorySweetness={flavorProfile.savorySweetness}
        healthIndulgence={flavorProfile.healthIndulgence}
        lightHeaviness={flavorProfile.lightHeaviness}
        reviewCount={item.reviews.filter(
          (r) => r.savorySweetness !== null || r.healthIndulgence !== null || r.lightHeaviness !== null
        ).length}
      />

      {/* Reviews section */}
      <ReviewsSection itemId={itemId} initialReviews={initialReviews} />
    </div>
  );
}
