import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import argon from "argon2";
import zod from "zod";
import { signToken } from "@/lib/auth";

const loginSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const isPasswordValid = await argon.verify(user.password, password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = signToken({ sub: user.id, email: user.email });

    const response = NextResponse.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 días
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
