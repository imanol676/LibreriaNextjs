import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  signToken,
  verifyToken,
  getUserFromRequest,
  clearAuthCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Mock de Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock de variables de entorno
vi.mock("process", () => ({
  env: {
    JWT_SECRET: "test-secret-key-for-testing-purposes-only",
  },
}));

describe("Auth Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signToken", () => {
    it("debería crear un token JWT válido", () => {
      const payload = { userId: "123", email: "test@example.com" };
      const token = signToken(payload);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT tiene 3 partes
    });

    it("debería crear tokens únicos para diferentes payloads", () => {
      const payload1 = { userId: "123", email: "test1@example.com" };
      const payload2 = { userId: "456", email: "test2@example.com" };

      const token1 = signToken(payload1);
      const token2 = signToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("debería verificar un token válido correctamente", () => {
      const payload = { sub: "123", email: "test@example.com" };
      const token = signToken(payload);

      const decoded = verifyToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.sub).toBe("123");
      expect(decoded?.email).toBe("test@example.com");
    });

    it("debería retornar null para un token inválido", () => {
      const invalidToken = "invalid.token.here";

      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it("debería retornar null para un token expirado", () => {
      // Creamos un token con expiración muy corta
      const jwt = require("jsonwebtoken");
      const expiredToken = jwt.sign(
        { sub: "123", email: "test@example.com" },
        "test-secret-key-for-testing-purposes-only",
        { expiresIn: "1ms" }
      );

      // Esperamos un poco para que expire
      setTimeout(() => {
        const decoded = verifyToken(expiredToken);
        expect(decoded).toBeNull();
      }, 10);
    });

    it("debería retornar null para token vacío", () => {
      const decoded = verifyToken("");
      expect(decoded).toBeNull();
    });
  });

  describe("getUserFromRequest", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    beforeEach(() => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    });

    it("debería obtener usuario desde header x-user-id", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "x-user-id": "user-123",
        },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    it("debería obtener usuario desde token en Authorization header", async () => {
      const payload = { sub: "user-123", email: "test@example.com" };
      const token = signToken(payload);

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    it("debería obtener usuario desde cookie", async () => {
      const payload = { sub: "user-123", email: "test@example.com" };
      const token = signToken(payload);

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          Cookie: `token=${token}; other=value`,
        },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    it("debería retornar null si no hay token", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("debería retornar null si el token es inválido", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("debería retornar null si el usuario no existe en la BD", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const payload = { sub: "nonexistent-user", email: "test@example.com" };
      const token = signToken(payload);

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "nonexistent-user" },
      });
    });
  });

  describe("clearAuthCookie", () => {
    it("debería eliminar la cookie de autenticación", () => {
      const response = new NextResponse();
      const deleteSpy = vi.spyOn(response.cookies, "delete");

      clearAuthCookie(response);

      expect(deleteSpy).toHaveBeenCalledWith("token");
    });
  });
});
