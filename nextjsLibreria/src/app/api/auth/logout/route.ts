import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json(
    { message: "Sesión cerrada exitosamente" },
    { status: 200 }
  );

  return clearAuthCookie(response);
}
