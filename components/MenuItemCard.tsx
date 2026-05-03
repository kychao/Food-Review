import Link from "next/link";
import Image from "next/image";
import StarRating from "@/components/StarRating";

interface Props {
  id: string;
  name: string;
  restaurantId: string;
  averageRating: number;
  reviewCount: number;
  topImage: string | null; // image from the most-liked review
}

export default function MenuItemCard({
  id,
  name,
  restaurantId,
  averageRating,
  reviewCount,
  topImage,
}: Props) {
  return (
    <Link
      href={`/restaurants/${restaurantId}/items/${id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/40 overflow-hidden"
      aria-label={`View reviews for ${name}`}
    >
      {/* Top image or placeholder */}
      {topImage ? (
        <div className="h-36 w-full overflow-hidden bg-gray-100">
          <Image
            src={topImage}
            alt={`Top photo for ${name}`}
            width={400}
            height={144}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-gray-50 text-4xl text-gray-300">
          🍽️
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-700">
            {name}
          </h3>
          <span className="shrink-0 text-xs text-gray-400">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(averageRating)} size="sm" />
          {reviewCount > 0 ? (
            <span className="text-xs text-gray-500">{averageRating.toFixed(1)}</span>
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
