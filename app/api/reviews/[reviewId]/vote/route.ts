import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await params;

  try {
    const body = await req.json();
    const vote = body.vote as string;

    if (vote !== "like" && vote !== "dislike") {
      return NextResponse.json({ error: "Vote must be 'like' or 'dislike'." }, { status: 400 });
    }

    // Get or create anonymous session ID from cookie
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("session_id")?.value;
    if (!sessionId) {
      sessionId = randomUUID();
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    // Check for existing vote
    const existing = await prisma.reviewVote.findUnique({
      where: { reviewId_sessionId: { reviewId, sessionId } },
    });

    let likes = review.likes;
    let dislikes = review.dislikes;

    if (existing) {
      if (existing.vote === vote) {
        // Same vote — remove it (toggle off)
        await prisma.reviewVote.delete({ where: { id: existing.id } });
        if (vote === "like") likes = Math.max(0, likes - 1);
        else dislikes = Math.max(0, dislikes - 1);
      } else {
        // Switching vote
        await prisma.reviewVote.update({
          where: { id: existing.id },
          data: { vote },
        });
        if (vote === "like") {
          likes += 1;
          dislikes = Math.max(0, dislikes - 1);
        } else {
          dislikes += 1;
          likes = Math.max(0, likes - 1);
        }
      }
    } else {
      // New vote
      await prisma.reviewVote.create({ data: { reviewId, sessionId, vote } });
      if (vote === "like") likes += 1;
      else dislikes += 1;
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { likes, dislikes },
    });

    const response = NextResponse.json({ likes: updated.likes, dislikes: updated.dislikes });
    // Set session cookie if new
    if (!cookieStore.get("session_id")?.value) {
      response.cookies.set("session_id", sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to record vote." }, { status: 500 });
  }
}
