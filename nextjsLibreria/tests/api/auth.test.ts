import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import { GET as meGET } from "@/app/api/auth/me/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Mock global de bcrypt
const mockBcrypt = {
  hash: vi.fn(),
  compare: vi.fn(),
};

vi.mock("bcrypt", () => ({
  default: mockBcrypt,
}));

// Mock de Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock de auth functions
vi.mock("@/lib/auth", () => ({
  signToken: vi.fn(),
  getUserFromRequest: vi.fn(),
}));

describe("Auth API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("debería hacer login exitosamente con credenciales válidas", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedPassword123",
        name: "Test User",
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const { signToken } = await import("@/lib/auth");
      (signToken as any).mockReturnValue("mocked-jwt-token");

      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await loginPOST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Login successful");
      expect(data.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("debería fallar con email inexistente", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "nonexistent@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await loginPOST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("debería fallar con contraseña incorrecta", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashedPassword123",
        name: "Test User",
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await loginPOST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid credentials");
    });

    it("debería fallar con datos faltantes", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          // password faltante
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await loginPOST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });
  });

  describe("POST /api/auth/register", () => {
    it("debería registrar un usuario exitosamente", async () => {
      const mockNewUser = {
        id: "user-456",
        email: "newuser@example.com",
        name: "New User",
        password: "hashedPassword123",
      };

      (prisma.user.findUnique as any).mockResolvedValue(null); // Email no existe
      mockBcrypt.hash.mockResolvedValue("hashedPassword123");
      (prisma.user.create as any).mockResolvedValue(mockNewUser);

      const { signToken } = await import("@/lib/auth");
      (signToken as any).mockReturnValue("mocked-jwt-token");

      const req = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "New User",
          email: "newuser@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await registerPOST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe("User created successfully");
      expect(data.user).toEqual({
        id: "user-456",
        email: "newuser@example.com",
        name: "New User",
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 12);
    });

    it("debería fallar si el email ya existe", async () => {
      const existingUser = {
        id: "user-123",
        email: "existing@example.com",
        name: "Existing User",
      };

      (prisma.user.findUnique as any).mockResolvedValue(existingUser);

      const req = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "New User",
          email: "existing@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await registerPOST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User already exists");
    });

    it("debería fallar con datos inválidos", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: "New User",
          email: "invalid-email", // Email inválido
          password: "123", // Contraseña muy corta
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await registerPOST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("validation");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("debería hacer logout exitosamente", async () => {
      const response = await logoutPOST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Logged out successfully");

      // Verificar que la cookie fue eliminada
      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toContain("token=");
      expect(setCookieHeader).toContain("Max-Age=0");
    });
  });

  describe("GET /api/auth/me", () => {
    it("debería retornar datos del usuario autenticado", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
      };

      const { getUserFromRequest } = await import("@/lib/auth");
      (getUserFromRequest as any).mockResolvedValue(mockUser);

      const req = new NextRequest("http://localhost:3000/api/auth/me", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await meGET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(mockUser);
    });

    it("debería fallar sin autenticación", async () => {
      const { getUserFromRequest } = await import("@/lib/auth");
      (getUserFromRequest as any).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/auth/me");

      const response = await meGET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
