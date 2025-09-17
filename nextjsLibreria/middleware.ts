import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

const PROTECTED_ROUTES = ["/api/favorites", "/api/reviews"];

// Rutas públicas específicas
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/search",
  "/api/books",
];

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
  } catch {
    return null;
  }
}

function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return false;
  }

  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  const cookieToken = request.cookies.get("token")?.value;

  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    return NextResponse.json({ message: "Token required" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", decoded.sub);
  requestHeaders.set("x-user-email", decoded.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
