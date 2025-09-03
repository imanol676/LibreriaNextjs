import { describe, it, expect, vi } from "vitest";
import { searchBooks } from "@/lib/googleBooks";

describe("searchBooks", () => {
  it("devuelve libros cuando la API responde bien", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "1",
            volumeInfo: {
              title: "Libro 1",
              authors: ["Autor"],
              description: "desc",
            },
          },
        ],
      }),
    });

    const books = await searchBooks("python");
    expect(books).toHaveLength(1);
    expect(books[0].volumeInfo.title).toBe("Libro 1");
  });

  it("devuelve [] cuando la API no tiene resultados", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const books = await searchBooks("xxxxxx");
    expect(books).toEqual([]);
  });

  it("lanza error si la API falla", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    await expect(searchBooks("java")).rejects.toThrow();
  });
});
