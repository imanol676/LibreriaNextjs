import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(3).max(5000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const body = await request.json();
    const { rating, content } = updateReviewSchema.parse(body);

    // Verificar que la reseña pertenece al usuario
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { message: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    if (existingReview.userId !== user.id) {
      return NextResponse.json(
        { message: "No tienes permiso para editar esta reseña" },
        { status: 403 }
      );
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { rating, content },
      include: {
        book: true,
        votes: true,
      },
    });

    return NextResponse.json({
      message: "Reseña actualizada exitosamente",
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        content: updatedReview.content,
        createdAt: updatedReview.createdAt,
        bookId: updatedReview.bookId,
        book: {
          id: updatedReview.book.id,
          title: updatedReview.book.title,
          authors: updatedReview.book.authors,
          thumbnailUrl: updatedReview.book.thumbnailUrl,
        },
        score: updatedReview.votes.reduce((sum, vote) => sum + vote.value, 0),
        votesCount: updatedReview.votes.length,
      },
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id: reviewId } = await params;

    // Verificar que la reseña pertenece al usuario
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { message: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    if (existingReview.userId !== user.id) {
      return NextResponse.json(
        { message: "No tienes permiso para eliminar esta reseña" },
        { status: 403 }
      );
    }

    // Eliminar votos asociados primero
    await prisma.vote.deleteMany({
      where: { reviewId },
    });

    // Eliminar la reseña
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({
      message: "Reseña eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
