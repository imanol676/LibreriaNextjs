import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { bookCreateSchema } from "@/lib/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bookCreateSchema.parse(body);

    // Verificar si el libro ya existe
    const existingBook = await prisma.book.findUnique({
      where: { id: validatedData.id },
    });

    if (existingBook) {
      return NextResponse.json(existingBook);
    }

    // Crear el libro si no existe
    const book = await prisma.book.create({
      data: {
        id: validatedData.id,
        title: validatedData.title,
        authors: validatedData.authors,
        thumbnailUrl: validatedData.thumbnailUrl,
        description: validatedData.description,
        pageCount: validatedData.pageCount,
        categories: validatedData.categories,
        publishedDate: validatedData.publishedDate,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: "Validation error", 
          errors: error.issues 
        }, 
        { status: 400 }
      );
    }
    
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
    console.error("Error with books:", error);
    
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}