import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }
    const items = await prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { reviews: true } },
        reviews: { select: { rating: true } },
      },
    });
    return NextResponse.json(
      items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        restaurantId: item.restaurantId,
        isUserSubmitted: item.isUserSubmitted,
        reviewCount: item._count.reviews,
        averageRating:
          item.reviews.length > 0
            ? item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length
            : 0,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch menu items." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Item name is required." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // Case-insensitive duplicate check (SQLite doesn't support mode: insensitive)
    const allItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      select: { id: true, name: true },
    });
    const existingItem = allItems.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );

    let item;
    if (existingItem) {
      // Item already exists — just attach the review to it instead of erroring
      item = existingItem;
    } else {
      item = await prisma.menuItem.create({
        data: { name, restaurantId, isUserSubmitted: true },
      });
    }

    // Optionally attach an initial review
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : null;
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;
    function parseSlider(val: unknown): number | null {
      const n = Number(val);
      if (isNaN(n)) return null;
      return Math.min(100, Math.max(0, Math.round(n)));
    }
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      await prisma.review.create({
        data: {
          rating,
          comment: comment || null,
          imageUrl,
          savorySweetness: parseSlider(body.savorySweetness),
          healthIndulgence: parseSlider(body.healthIndulgence),
          lightHeaviness: parseSlider(body.lightHeaviness),
          menuItemId: item.id,
        },
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create menu item." }, { status: 500 });
  }
}
