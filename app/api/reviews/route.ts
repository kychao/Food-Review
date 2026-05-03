import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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

    return NextResponse.json(
      reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        imageUrl: r.imageUrl,
        likes: r.likes,
        dislikes: r.dislikes,
        createdAt: r.createdAt.toISOString(),
        menuItemId: r.menuItemId,
        menuItemName: r.menuItem.name,
        restaurantId: r.menuItem.restaurant.id,
        restaurantName: r.menuItem.restaurant.name,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch feed." }, { status: 500 });
  }
}
