import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { menuItems: true } } },
    });
    return NextResponse.json(
      restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        itemCount: r._count.menuItems,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch restaurants." }, { status: 500 });
  }
}
