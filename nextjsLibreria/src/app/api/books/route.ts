import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      id,
      title,
      authors,
      thumbnailUrl,
      description,
      pageCount,
      categories,
      publishedDate,
    } = await request.json();

    if (!id || !title) {
      return NextResponse.json(
        { message: "Book ID and title are required" },
        { status: 400 }
      );
    }

    // Verificar si el libro ya existe
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (existingBook) {
      return NextResponse.json(existingBook);
    }

    // Crear el libro si no existe
    const book = await prisma.book.create({
      data: {
        id,
        title,
        authors: authors || [],
        thumbnailUrl,
        description,
        pageCount,
        categories: categories || [],
        publishedDate,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const book = await prisma.book.findUnique({
        where: { id },
      });

      if (!book) {
        return NextResponse.json(
          { message: "Book not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(book);
    }

    // Si no se especifica ID, devolver todos los libros (paginado)
    const books = await prisma.book.findMany({
      take: 20, // limitar a 20 libros por defecto
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Error getting books:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
