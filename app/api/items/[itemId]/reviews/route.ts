import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }
    const reviews = await prisma.review.findMany({
      where: { menuItemId: itemId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch {
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  try {
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment : undefined;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }
    if (comment !== undefined && comment.length > 500) {
      return NextResponse.json(
        { error: "Comment must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;

    // Slider values: 0–100 or null if not provided
    function parseSlider(val: unknown): number | null {
      const n = Number(val);
      if (isNaN(n)) return null;
      return Math.min(100, Math.max(0, Math.round(n)));
    }
    const savorySweetness = parseSlider(body.savorySweetness);
    const healthIndulgence = parseSlider(body.healthIndulgence);
    const lightHeaviness = parseSlider(body.lightHeaviness);

    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        imageUrl,
        savorySweetness,
        healthIndulgence,
        lightHeaviness,
        menuItemId: itemId,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
