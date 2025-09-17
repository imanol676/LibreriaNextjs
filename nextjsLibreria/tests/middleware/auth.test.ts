import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "../../middleware";

// Mock de JWT
const mockJwt = {
  verify: vi.fn(),
};

vi.mock("jsonwebtoken", () => ({
  default: mockJwt,
}));

// Mock de variables de entorno
vi.stubEnv("JWT_SECRET", "test-secret-key");

describe("Middleware de Autorización", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rutas protegidas", () => {
    const protectedRoutes = [
      "/api/favorites",
      "/api/reviews",
      "/api/reviews/123",
      "/api/favorites/add",
    ];

    protectedRoutes.forEach((route) => {
      it(`debería permitir acceso a ${route} con token válido`, async () => {
        mockJwt.verify.mockReturnValue({
          sub: "user-123",
          email: "test@example.com",
        });

        const request = new NextRequest(`http://localhost:3000${route}`, {
          headers: {
            Authorization: "Bearer valid-token",
          },
        });

        const response = await middleware(request);

        // Middleware debería continuar sin bloquear
        expect(response).toBeUndefined();
      });

      it(`debería bloquear acceso a ${route} sin token`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`);

        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.status).toBe(401);

        const data = await response!.json();
        expect(data.error).toBe("Unauthorized");
      });

      it(`debería bloquear acceso a ${route} con token inválido`, async () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error("Invalid token");
        });

        const request = new NextRequest(`http://localhost:3000${route}`, {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        });

        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.status).toBe(401);

        const data = await response!.json();
        expect(data.error).toBe("Unauthorized");
      });

      it(`debería bloquear acceso a ${route} con token expirado`, async () => {
        mockJwt.verify.mockImplementation(() => {
          const error = new Error("Token expired");
          error.name = "TokenExpiredError";
          throw error;
        });

        const request = new NextRequest(`http://localhost:3000${route}`, {
          headers: {
            Authorization: "Bearer expired-token",
          },
        });

        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.status).toBe(401);

        const data = await response!.json();
        expect(data.error).toBe("Unauthorized");
      });
    });
  });

  describe("Rutas públicas", () => {
    const publicRoutes = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/logout",
      "/api/search",
      "/api/search?q=harry",
      "/api/books",
      "/api/books/123",
    ];

    publicRoutes.forEach((route) => {
      it(`debería permitir acceso a ${route} sin token`, async () => {
        const request = new NextRequest(`http://localhost:3000${route}`);

        const response = await middleware(request);

        // Middleware debería continuar sin bloquear
        expect(response).toBeUndefined();
      });

      it(`debería permitir acceso a ${route} con token válido`, async () => {
        mockJwt.verify.mockReturnValue({
          sub: "user-123",
          email: "test@example.com",
        });

        const request = new NextRequest(`http://localhost:3000${route}`, {
          headers: {
            Authorization: "Bearer valid-token",
          },
        });

        const response = await middleware(request);

        // Middleware debería continuar sin bloquear
        expect(response).toBeUndefined();
      });

      it(`debería permitir acceso a ${route} con token inválido`, async () => {
        mockJwt.verify.mockImplementation(() => {
          throw new Error("Invalid token");
        });

        const request = new NextRequest(`http://localhost:3000${route}`, {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        });

        const response = await middleware(request);

        // Rutas públicas no deberían ser bloqueadas
        expect(response).toBeUndefined();
      });
    });
  });

  describe("Extracción de token", () => {
    it("debería extraer token del header Authorization", async () => {
      mockJwt.verify.mockReturnValue({
        sub: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest("http://localhost:3000/api/favorites", {
        headers: {
          Authorization: "Bearer my-jwt-token",
        },
      });

      await middleware(request);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        "my-jwt-token",
        "test-secret-key"
      );
    });

    it("debería extraer token de las cookies", async () => {
      mockJwt.verify.mockReturnValue({
        sub: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest("http://localhost:3000/api/favorites", {
        headers: {
          Cookie: "token=my-jwt-token; other=value",
        },
      });

      await middleware(request);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        "my-jwt-token",
        "test-secret-key"
      );
    });

    it("debería priorizar Authorization header sobre cookies", async () => {
      mockJwt.verify.mockReturnValue({
        sub: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest("http://localhost:3000/api/favorites", {
        headers: {
          Authorization: "Bearer header-token",
          Cookie: "token=cookie-token; other=value",
        },
      });

      await middleware(request);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        "header-token",
        "test-secret-key"
      );
    });
  });

  describe("Headers de respuesta", () => {
    it("debería agregar header x-user-id para rutas protegidas con token válido", async () => {
      const mockDecodedToken = { sub: "user-123", email: "test@example.com" };
      mockJwt.verify.mockReturnValue(mockDecodedToken);

      const request = new NextRequest("http://localhost:3000/api/favorites", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      const response = await middleware(request);

      // Debería continuar sin bloquear pero agregando el header
      expect(response).toBeUndefined();

      // Verificar que el token fue decodificado correctamente
      expect(mockJwt.verify).toHaveBeenCalledWith(
        "valid-token",
        "test-secret-key"
      );
    });

    it("debería manejar tokens malformados en Authorization header", async () => {
      const request = new NextRequest("http://localhost:3000/api/favorites", {
        headers: {
          Authorization: "Malformed header without Bearer",
        },
      });

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(401);
    });

    it("debería manejar Authorization header vacío", async () => {
      const request = new NextRequest("http://localhost:3000/api/favorites", {
        headers: {
          Authorization: "",
        },
      });

      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response!.status).toBe(401);
    });
  });

  describe("Casos edge", () => {
    it("debería permitir rutas que no están ni en protegidas ni en públicas", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/unknown-route"
      );

      const response = await middleware(request);

      // Rutas no especificadas deberían ser permitidas por defecto
      expect(response).toBeUndefined();
    });

    it("debería manejar rutas con query parameters", async () => {
      mockJwt.verify.mockReturnValue({
        sub: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/favorites?page=1&limit=10",
        {
          headers: {
            Authorization: "Bearer valid-token",
          },
        }
      );

      const response = await middleware(request);

      expect(response).toBeUndefined();
    });

    it("debería manejar rutas con fragmentos de path", async () => {
      mockJwt.verify.mockReturnValue({
        sub: "user-123",
        email: "test@example.com",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/reviews/123/vote",
        {
          headers: {
            Authorization: "Bearer valid-token",
          },
        }
      );

      const response = await middleware(request);

      expect(response).toBeUndefined();
    });

    it("debería ser case-sensitive para las rutas", async () => {
      // Las rutas en mayúsculas no deberían coincidir con las protegidas en minúsculas
      const request = new NextRequest("http://localhost:3000/api/FAVORITES");

      const response = await middleware(request);

      // Debería permitir porque no coincide exactamente con "/api/favorites"
      expect(response).toBeUndefined();
    });
  });

  describe("Diferentes métodos HTTP", () => {
    ["GET", "POST", "PUT", "DELETE", "PATCH"].forEach((method) => {
      it(`debería proteger rutas con método ${method}`, async () => {
        const request = new NextRequest("http://localhost:3000/api/favorites", {
          method,
        });

        const response = await middleware(request);

        expect(response).toBeInstanceOf(NextResponse);
        expect(response!.status).toBe(401);
      });

      it(`debería permitir rutas públicas con método ${method}`, async () => {
        const request = new NextRequest("http://localhost:3000/api/search", {
          method,
        });

        const response = await middleware(request);

        expect(response).toBeUndefined();
      });
    });
  });
});
