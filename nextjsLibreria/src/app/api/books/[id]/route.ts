import { NextResponse, NextRequest } from "next/server";
import { getBookById, pickThumb } from "@/lib/googleBooks";
import { prisma } from "@/lib/prisma";

type ReviewWithUserAndVotes = {
  id: string;
  rating: number;
  content: string;
  createdAt: Date;
  user: { id: string; name: string | null };
  votes: { value: number }[];
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookId } = await params;

  if (!bookId) {
    return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
  }

  try {
    const book = await getBookById(bookId);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const mappedBook = {
      id: book.id,
      title: book.volumeInfo.title,
      authors: book.volumeInfo.authors || [],
      description: book.volumeInfo.description || "",
      thumbnail: pickThumb(book.volumeInfo),
    };

    let dbBook;
    let retries = 3;

    while (retries > 0) {
      try {
        dbBook = await prisma.book.upsert({
          where: { id: bookId },
          update: {
            title: mappedBook.title ?? "",
            authors: mappedBook.authors.join(", "),
            description: mappedBook.description,
            thumbnailUrl: mappedBook.thumbnail,
          },
          create: {
            id: bookId,
            title: mappedBook.title ?? "",
            authors: mappedBook.authors.join(", "),
            description: mappedBook.description,
            thumbnailUrl: mappedBook.thumbnail,
          },
          include: { reviews: { include: { user: true, votes: true } } },
        });
        break;
      } catch (dbError: unknown) {
        retries--;
        console.error(`Database error (${retries} retries left):`, dbError);

        if (retries === 0) {
          throw dbError;
        }

        // Wait briefly before retry
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (!dbBook) {
      throw new Error("Failed to create or retrieve book from database");
    }

    const local = dbBook.reviews.map((r: ReviewWithUserAndVotes) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt,
      user: { id: r.user.id, displayName: r.user.name ?? "Guest" },
      score: r.votes.reduce(
        (s: number, v: { value: number }) => s + v.value,
        0
      ),
    }));

    return NextResponse.json({ ...mappedBook, local: { reviews: local } });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
