import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ restaurants: [], menuItems: [] });
  }

  const lower = q.toLowerCase();

  try {
    // SQLite doesn't support mode: insensitive, so fetch and filter in JS
    const [allRestaurants, allItems] = await Promise.all([
      prisma.restaurant.findMany({
        include: { _count: { select: { menuItems: true } } },
      }),
      prisma.menuItem.findMany({
        include: {
          restaurant: { select: { id: true, name: true } },
          _count: { select: { reviews: true } },
          reviews: { select: { rating: true } },
        },
      }),
    ]);

    const restaurants = allRestaurants
      .filter((r) => r.name.toLowerCase().includes(lower))
      .map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        itemCount: r._count.menuItems,
      }));

    const menuItems = allItems
      .filter((item) => item.name.toLowerCase().includes(lower))
      .map((item) => ({
        id: item.id,
        name: item.name,
        restaurantId: item.restaurant.id,
        restaurantName: item.restaurant.name,
        reviewCount: item._count.reviews,
        averageRating:
          item.reviews.length > 0
            ? item.reviews.reduce((s, r) => s + r.rating, 0) / item.reviews.length
            : 0,
      }));

    return NextResponse.json({ restaurants, menuItems });
  } catch {
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
