import { prisma } from "@/lib/prisma";

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { name: "asc" },
  });
}
