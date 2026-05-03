import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { type RawMenuItem } from "@/lib/flavorEngine";
import { inferFlavorWithAI } from "@/lib/groqFlavor";

/**
 * Returns all menu items with resolved flavor data.
 * For items with no community data, tries keyword inference first,
 * then falls back to Groq AI for unknown item names.
 */
export async function POST(req: NextRequest) {
  try {
    await req.json(); // consume body

    const items = await prisma.menuItem.findMany({
      include: {
        restaurant: { select: { id: true, name: true } },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            imageUrl: true,
            likes: true,
            dislikes: true,
            savorySweetness: true,
            healthIndulgence: true,
            lightHeaviness: true,
          },
        },
      },
    });

    const rawItems: RawMenuItem[] = items.map((item) => {
      const reviewsWithFlavor = item.reviews.filter(
        (r) => r.savorySweetness !== null || r.healthIndulgence !== null || r.lightHeaviness !== null
      );
      const communityFlavor =
        reviewsWithFlavor.length > 0
          ? {
              savorySweetness: avg(reviewsWithFlavor.map((r) => r.savorySweetness)) ?? undefined,
              healthIndulgence: avg(reviewsWithFlavor.map((r) => r.healthIndulgence)) ?? undefined,
              lightHeaviness: avg(reviewsWithFlavor.map((r) => r.lightHeaviness)) ?? undefined,
            }
          : null;

      const topImageReview = item.reviews
        .filter((r) => r.imageUrl)
        .sort((a, b) => b.likes - b.dislikes - (a.likes - a.dislikes))[0];

      const avgRating =
        item.reviews.length > 0
          ? item.reviews.reduce((s, r) => s + r.rating, 0) / item.reviews.length
          : 0;

      // Top 2 most-liked reviews with comments
      const topReviews = item.reviews
        .filter((r) => r.comment)
        .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
        .slice(0, 2)
        .map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          likes: r.likes,
        }));

      return {
        id: item.id,
        name: item.name,
        restaurantId: item.restaurant.id,
        restaurantName: item.restaurant.name,
        averageRating: avgRating,
        reviewCount: item.reviews.length,
        topImage: topImageReview?.imageUrl ?? null,
        topReviews,
        communityFlavor,
      };
    });

    // Enrich all items without community flavor data using AI first,
    // falling back to keyword inference if AI fails.
    const enrichedItems = await Promise.all(
      rawItems.map(async (item) => {
        // If we already have community data, use it directly
        if (item.communityFlavor?.savorySweetness != null) {
          return { ...item, _flavorSource: "community" };
        }

        // Try AI for everything without community data
        const aiFlavor = await inferFlavorWithAI(item.name);
        if (aiFlavor) {
          console.log(`[Cravings] AI flavor for "${item.name}":`, aiFlavor);
          return {
            ...item,
            communityFlavor: aiFlavor,
            _flavorSource: "ai",
          };
        }

        // Last resort: keyword inference
        console.log(`[Cravings] Keyword inference for "${item.name}"`);
        return { ...item, _flavorSource: "inferred" };
      })
    );

    console.log(`[Cravings] Total items: ${enrichedItems.length}`);
    return NextResponse.json(enrichedItems);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load items." }, { status: 500 });
  }
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}
