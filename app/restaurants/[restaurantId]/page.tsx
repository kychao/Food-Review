import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MenuItemCard from "@/components/MenuItemCard";
import EmptyState from "@/components/EmptyState";
import AddMenuItemButton from "@/components/AddMenuItemButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ restaurantId: string }>;
}

export default async function RestaurantPage({ params }: Props) {
  const { restaurantId } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menuItems: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { reviews: true } },
          reviews: {
            select: { rating: true, imageUrl: true, likes: true, dislikes: true },
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  const items = restaurant.menuItems.map((item) => {
    // Find the review with the highest net likes that has an image
    const topImageReview = item.reviews
      .filter((r) => r.imageUrl)
      .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))[0];

    return {
      id: item.id,
      name: item.name,
      restaurantId: item.restaurantId,
      reviewCount: item._count.reviews,
      topImage: topImageReview?.imageUrl ?? null,
      averageRating:
        item.reviews.length > 0
          ? item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length
          : 0,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <Link href="/" className="hover:text-green-700">
          Home
        </Link>
        <span className="mx-2" aria-hidden="true">›</span>
        <span className="text-gray-900 font-medium">{restaurant.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="mt-1 text-sm text-gray-500">{restaurant.description}</p>
          )}
        </div>
        <AddMenuItemButton restaurantId={restaurantId} />
      </div>

      {/* Menu items */}
      {items.length === 0 ? (
        <EmptyState message="No menu items yet. Be the first to add one!" />
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label={`Menu items at ${restaurant.name}`}
        >
          {items.map((item) => (
            <li key={item.id}>
              <MenuItemCard {...item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
