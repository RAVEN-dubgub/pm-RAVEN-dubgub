import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listUsers } from "@/lib/users";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await listUsers();

  return NextResponse.json({ users });
}
