import { GET } from "../../src/app/api/search/route";
import { NextRequest } from "next/server";
import { expect, test } from "vitest";

test("devuelve resultados para un libro existente", async () => {
  const req = new NextRequest("http://localhost:3000/api/search?q=HarryPotter");
  const res = await GET(req);
  const data = await res.json();

  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});

test("devuelve array vacío si no hay resultados", async () => {
  const req = new NextRequest(
    "http://localhost:3000/api/search?q=libroInexistente"
  );
  const res = await GET(req);
  const data = await res.json();

  expect(data).toEqual([]);
});
