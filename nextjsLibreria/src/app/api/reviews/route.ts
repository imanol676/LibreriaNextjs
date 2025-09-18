import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";
import { reviewCreateSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = reviewCreateSchema.parse(body);

    const book = await prisma.book.upsert({
      where: { id: parsedBody.googleId },
      update: {
        title: parsedBody.title,
        authors: parsedBody.authors,
        thumbnailUrl: parsedBody.thumbnail ?? undefined,
      },
      create: {
        id: parsedBody.googleId,
        title: parsedBody.title,
        authors: parsedBody.authors,
        thumbnailUrl: parsedBody.thumbnail ?? undefined,
      },
    });

    const review = await prisma.review.create({
      data: {
        bookId: book.id,
        userId: user.id,
        rating: parsedBody.rating,
        content: parsedBody.content,
      },
    });

    return NextResponse.json({
      message: "Review created successfully",
      review: {
        ...review,
        book: {
          id: book.id,
          title: book.title,
          authors: book.authors,
          thumbnailUrl: book.thumbnailUrl,
        },
      },
    });
  } catch (error) {
    console.error("Review creation error:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Review already exists for this book" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
