import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import argon from "argon2";
import zod from "zod";
import { signToken } from "@/lib/auth";

const registerSchema = zod.object({
  name: zod.string().min(3).max(100),
  email: zod.string().email(),
  password: zod.string().min(6).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "El usuario ya existe" },
        { status: 400 }
      );
    }

    const hashedPassword = await argon.hash(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const token = signToken({ sub: user.id, email: user.email });

    const response = NextResponse.json({
      message: "Registro exitoso",
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
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
