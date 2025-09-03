import { POST } from "@/app/api/reviews/route";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/user";
import { NextRequest } from "next/server";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/user", () => ({
  ensureUser: vi.fn(),
}));

describe("Reviews API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea una reseña correctamente", async () => {
    // Mock: usuario autenticado
    (ensureUser as any).mockResolvedValue({
      id: "test-user-id-123",
      name: "Test User",
    });

    // Mock: creación/actualización del libro
    (prisma.book.upsert as any).mockResolvedValue({
      id: "test-google-id-123",
      title: "Test Book Title",
      authors: "Test Author",
      thumbnailUrl: null,
    });

    (prisma.review.create as any).mockResolvedValue({
      id: "test-review-id-123",
      content: "This is a test review content.",
      rating: 5,
      bookId: "test-google-id-123",
      userId: "test-user-id-123",
    });

    const req = new NextRequest("http://localhost:3000/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        googleId: "test-google-id-123",
        title: "Test Book Title",
        authors: "Test Author",
        rating: 5,
        content: "This is a test review content.",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Review created successfully");
    expect(data.review).toBeDefined();
    expect(data.review.book.id).toBe("test-google-id-123");

    // Chequeamos que Prisma fue llamado correctamente
    expect(prisma.book.upsert).toHaveBeenCalledWith({
      where: { id: "test-google-id-123" },
      update: expect.objectContaining({
        title: "Test Book Title",
        authors: "Test Author",
      }),
      create: expect.objectContaining({
        id: "test-google-id-123",
        title: "Test Book Title",
        authors: "Test Author",
      }),
    });
    expect(prisma.review.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        content: "This is a test review content.",
        rating: 5,
        userId: "test-user-id-123",
        bookId: "test-google-id-123",
      }),
    });
  });
});
