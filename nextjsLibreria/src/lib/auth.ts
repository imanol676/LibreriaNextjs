import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const JWT_EXPIRES = "7d";

const TOKEN_NAME = "token";

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest | Request) {
  if (req instanceof Request) {
    const userId = req.headers.get("x-user-id");
    if (userId) {
      return prisma.user.findUnique({ where: { id: userId } });
    }
  }

  let token: string | undefined;

  if (req instanceof NextRequest) {
    // NextRequest has cookies
    token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.split(" ")[1];
  } else {
    // Regular Request - parse from headers
    token =
      req.headers.get("authorization")?.split(" ")[1] ||
      req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return prisma.user.findUnique({ where: { id: decoded.sub } });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(TOKEN_NAME);
  return response;
}
