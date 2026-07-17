import { NextResponse } from "next/server";
import { z } from "zod";
import {
  attachSessionCookie,
  createSessionToken,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login data" }, { status: 400 });
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json(
        {
          error:
            "Invalid email or password. If you have not signed up yet, create an account first.",
        },
        { status: 401 },
      );
    }

    const sessionUser = { id: user.id, email: user.email, name: user.name };
    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("login error", error);
    const message =
      error instanceof Error && error.message === "AUTH_SECRET is not set"
        ? "Server auth is not configured. Contact the site owner."
        : "Login failed. Please try again in a moment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
