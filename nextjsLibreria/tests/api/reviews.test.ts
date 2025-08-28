import { POST } from "@/app/api/reviews/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("Reviews API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea una reseña correctamente", async () => {
    // Mock: libro ya existente
    (prisma.book.findUnique as any).mockResolvedValue({
      id: "test-google-id-123",
      title: "Test Book Title",
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
      body: JSON.stringify({ rating: 5, content: "Test", userId: "123" }),
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
    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: "test-google-id-123" },
    });
    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "This is a test review content.",
        rating: 5,
        userId: "test-user-id-123",
        bookId: "test-google-id-123",
      })
    );
  });
});
