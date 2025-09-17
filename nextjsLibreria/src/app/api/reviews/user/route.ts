import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: {
        book: true,
        votes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt,
      bookId: review.bookId,
      book: {
        id: review.book.id,
        title: review.book.title,
        authors: review.book.authors,
        thumbnailUrl: review.book.thumbnailUrl,
      },
      score: review.votes.reduce((sum, vote) => sum + vote.value, 0),
      votesCount: review.votes.length,
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error("Error getting user reviews:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
