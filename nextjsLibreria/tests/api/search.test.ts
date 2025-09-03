import { GET } from "../../src/app/api/search/route";
import { NextRequest } from "next/server";
import { expect, test, vi, beforeEach } from "vitest";
import { searchBooks, pickThumb } from "@/lib/googleBooks";

vi.mock("@/lib/googleBooks", () => ({
  searchBooks: vi.fn(),
  pickThumb: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("devuelve resultados para un libro existente", async () => {
  // Mock de searchBooks que devuelve libros
  (searchBooks as any).mockResolvedValue([
    {
      id: "1",
      volumeInfo: {
        title: "Harry Potter",
        authors: ["J.K. Rowling"],
        description: "A magical story",
      },
    },
  ]);

  // Mock de pickThumb
  (pickThumb as any).mockReturnValue("http://example.com/thumb.jpg");

  const req = new NextRequest("http://localhost:3000/api/search?q=HarryPotter");
  const res = await GET(req);
  const data = await res.json();

  expect(Array.isArray(data.results)).toBe(true);
  expect(data.results.length).toBeGreaterThan(0);
  expect(typeof data.total).toBe("number");
  expect(data.results[0].title).toBe("Harry Potter");
});

test("devuelve array vacío si no hay resultados", async () => {
  // Mock de searchBooks que devuelve array vacío
  (searchBooks as any).mockResolvedValue([]);

  // Mock de pickThumb (aunque no se usará)
  (pickThumb as any).mockReturnValue(null);

  const req = new NextRequest(
    "http://localhost:3000/api/search?q=libroInexistente"
  );
  const res = await GET(req);
  const data = await res.json();

  expect(data.results).toEqual([]);
  expect(data.total).toBe(0);
});
