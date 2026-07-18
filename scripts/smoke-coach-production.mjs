import { readFileSync } from "node:fs";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      let value = trimmed.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional file
  }
}

loadEnvFile(".env.production.local");
loadEnvFile(".env");

const TASK_ID = "cmrpnd2ha0003rdh1g0k8f4db";
const BASE = "https://pm-raven-dubgub.vercel.app";
const OWNER_EMAIL = "wolfscotland@gmail.com";

async function main() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET missing");

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!user) throw new Error("User not found");

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));

  const response = await fetch(`${BASE}/api/tasks/${TASK_ID}/coach`, {
    method: "POST",
    headers: { Cookie: `cohort_pm_session=${token}` },
  });

  const body = await response.json();
  const coach = body.coach;

  const result = {
    httpStatus: response.status,
    templateCoach: true,
    error: body.error ?? null,
    coachOk: Boolean(
      coach?.summary &&
        Array.isArray(coach.tips) &&
        coach.tips.length > 0 &&
        coach.cursorPrompt &&
        coach.gitSteps?.branchName &&
        Array.isArray(coach.gitSteps?.commands) &&
        coach.gitSteps?.commitMessage &&
        coach.gitSteps?.prTitle &&
        coach.gitSteps?.prBody &&
        Array.isArray(coach.doneWhen) &&
        coach.doneWhen.length > 0,
    ),
    tipCount: coach?.tips?.length ?? 0,
    branchName: coach?.gitSteps?.branchName ?? null,
    promptLength: coach?.cursorPrompt?.length ?? 0,
  };

  console.log(JSON.stringify(result, null, 2));

  await prisma.$disconnect();

  if (response.status !== 200 || !result.coachOk) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
