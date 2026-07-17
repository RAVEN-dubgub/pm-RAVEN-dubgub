import { NextResponse } from "next/server";
import { z } from "zod";
import {
  attachSessionCookie,
  createSessionToken,
  hashPassword,
  normalizeEmail,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid signup data" }, { status: 400 });
    }

    const { name, password } = parsed.data;
    const email = normalizeEmail(parsed.data.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered. Try signing in instead." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, name: true },
    });

    const token = await createSessionToken(user);
    const response = NextResponse.json({ user });
    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("signup error", error);
    const message =
      error instanceof Error && error.message === "AUTH_SECRET is not set"
        ? "Server auth is not configured. Contact the site owner."
        : "Signup failed. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
