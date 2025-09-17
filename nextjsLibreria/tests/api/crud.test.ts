import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as booksGET, POST as booksPOST } from "@/app/api/books/route";
import { GET as bookByIdGET } from "@/app/api/books/[id]/route";
import { POST as reviewsPOST } from "@/app/api/reviews/route";
import {
  GET as favoritesGET,
  POST as favoritesPOST,
  DELETE as favoritesDELETE,
} from "@/app/api/favorites/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Mock de Prisma con todas las operaciones CRUD
vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    favorite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock de auth functions
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi.fn(),
}));

// Mock de Google Books API
vi.mock("@/lib/googleBooks", () => ({
  searchBooks: vi.fn(),
  getBookById: vi.fn(),
}));

describe("Database CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Books CRUD", () => {
    const mockBook = {
      id: "book-123",
      title: "Test Book",
      authors: ["Test Author"],
      description: "Test Description",
      publishedDate: "2023-01-01",
      pageCount: 300,
      categories: ["Fiction"],
      imageLinks: {
        thumbnail: "http://example.com/image.jpg",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe("GET /api/books", () => {
      it("debería obtener todos los libros", async () => {
        (prisma.book.findMany as any).mockResolvedValue([mockBook]);

        const req = new NextRequest("http://localhost:3000/api/books");
        const response = await booksGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([mockBook]);
        expect(prisma.book.findMany).toHaveBeenCalledWith({
          include: {
            reviews: true,
          },
        });
      });

      it("debería manejar errores de base de datos", async () => {
        (prisma.book.findMany as any).mockRejectedValue(
          new Error("Database error")
        );

        const req = new NextRequest("http://localhost:3000/api/books");
        const response = await booksGET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Internal server error");
      });
    });

    describe("GET /api/books/[id]", () => {
      it("debería obtener un libro por ID", async () => {
        (prisma.book.findUnique as any).mockResolvedValue(mockBook);

        const params = Promise.resolve({ id: "book-123" });
        const response = await bookByIdGET(
          new NextRequest("http://localhost:3000/api/books/book-123"),
          { params }
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockBook);
        expect(prisma.book.findUnique).toHaveBeenCalledWith({
          where: { id: "book-123" },
          include: {
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      });

      it("debería retornar 404 si el libro no existe", async () => {
        (prisma.book.findUnique as any).mockResolvedValue(null);

        const params = Promise.resolve({ id: "nonexistent" });
        const response = await bookByIdGET(
          new NextRequest("http://localhost:3000/api/books/nonexistent"),
          { params }
        );
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Book not found");
      });
    });

    describe("POST /api/books", () => {
      it("debería crear un nuevo libro", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        (prisma.book.findUnique as any).mockResolvedValue(null); // Libro no existe
        (prisma.book.create as any).mockResolvedValue(mockBook);

        const req = new NextRequest("http://localhost:3000/api/books", {
          method: "POST",
          body: JSON.stringify({
            id: "book-123",
            title: "Test Book",
            authors: ["Test Author"],
            description: "Test Description",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        });

        const response = await booksPOST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.book).toEqual(mockBook);
        expect(prisma.book.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: "book-123",
            title: "Test Book",
            authors: ["Test Author"],
            description: "Test Description",
          }),
        });
      });

      it("debería fallar sin autenticación", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue(null);

        const req = new NextRequest("http://localhost:3000/api/books", {
          method: "POST",
          body: JSON.stringify({
            id: "book-123",
            title: "Test Book",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const response = await booksPOST(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      });
    });
  });

  describe("Reviews CRUD", () => {
    const mockReview = {
      id: "review-123",
      content: "Great book!",
      rating: 5,
      bookId: "book-123",
      userId: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe("POST /api/reviews", () => {
      it("debería crear una nueva reseña", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        (prisma.book.findUnique as any).mockResolvedValue({
          id: "book-123",
          title: "Test Book",
        });
        (prisma.review.create as any).mockResolvedValue(mockReview);

        const req = new NextRequest("http://localhost:3000/api/reviews", {
          method: "POST",
          body: JSON.stringify({
            content: "Great book!",
            rating: 5,
            bookId: "book-123",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        });

        const response = await reviewsPOST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.review).toEqual(mockReview);
        expect(prisma.review.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            content: "Great book!",
            rating: 5,
            bookId: "book-123",
            userId: "user-123",
          }),
        });
      });

      it("debería fallar con rating inválido", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        const req = new NextRequest("http://localhost:3000/api/reviews", {
          method: "POST",
          body: JSON.stringify({
            content: "Great book!",
            rating: 6, // Rating inválido (>5)
            bookId: "book-123",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        });

        const response = await reviewsPOST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Rating must be between 1 and 5");
      });
    });
  });

  describe("Favorites CRUD", () => {
    const mockFavorite = {
      id: "favorite-123",
      userId: "user-123",
      bookId: "book-123",
      createdAt: new Date(),
      book: {
        id: "book-123",
        title: "Test Book",
        authors: ["Test Author"],
      },
    };

    describe("GET /api/favorites", () => {
      it("debería obtener favoritos del usuario", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        (prisma.favorite.findMany as any).mockResolvedValue([mockFavorite]);

        const req = new NextRequest("http://localhost:3000/api/favorites", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        });

        const response = await favoritesGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual([mockFavorite]);
        expect(prisma.favorite.findMany).toHaveBeenCalledWith({
          where: { userId: "user-123" },
          include: {
            book: true,
          },
        });
      });
    });

    describe("POST /api/favorites", () => {
      it("debería agregar un libro a favoritos", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        (prisma.favorite.findUnique as any).mockResolvedValue(null); // No existe
        (prisma.favorite.create as any).mockResolvedValue(mockFavorite);

        const req = new NextRequest("http://localhost:3000/api/favorites", {
          method: "POST",
          body: JSON.stringify({
            bookId: "book-123",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        });

        const response = await favoritesPOST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.favorite).toEqual(mockFavorite);
        expect(prisma.favorite.create).toHaveBeenCalledWith({
          data: {
            userId: "user-123",
            bookId: "book-123",
          },
          include: {
            book: true,
          },
        });
      });

      it("debería fallar si el libro ya está en favoritos", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        (prisma.favorite.findUnique as any).mockResolvedValue(mockFavorite); // Ya existe

        const req = new NextRequest("http://localhost:3000/api/favorites", {
          method: "POST",
          body: JSON.stringify({
            bookId: "book-123",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        });

        const response = await favoritesPOST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe("Book already in favorites");
      });
    });

    describe("DELETE /api/favorites", () => {
      it("debería eliminar un libro de favoritos", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        (prisma.favorite.findUnique as any).mockResolvedValue(mockFavorite);
        (prisma.favorite.delete as any).mockResolvedValue(mockFavorite);

        const req = new NextRequest("http://localhost:3000/api/favorites", {
          method: "DELETE",
          body: JSON.stringify({
            bookId: "book-123",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        });

        const response = await favoritesDELETE(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe("Favorite removed successfully");
        expect(prisma.favorite.delete).toHaveBeenCalledWith({
          where: {
            userId_bookId: {
              userId: "user-123",
              bookId: "book-123",
            },
          },
        });
      });

      it("debería fallar si el favorito no existe", async () => {
        const { getUserFromRequest } = await import("@/lib/auth");
        (getUserFromRequest as any).mockResolvedValue({
          id: "user-123",
          email: "test@example.com",
        });

        (prisma.favorite.findUnique as any).mockResolvedValue(null); // No existe

        const req = new NextRequest("http://localhost:3000/api/favorites", {
          method: "DELETE",
          body: JSON.stringify({
            bookId: "book-123",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
        });

        const response = await favoritesDELETE(req);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe("Favorite not found");
      });
    });
  });
});
