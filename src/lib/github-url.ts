import { z } from "zod";

const githubRepoUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.hostname === "github.com" && url.pathname.split("/").filter(Boolean).length >= 2;
      } catch {
        return false;
      }
    },
    { message: "Must be a valid GitHub repo URL (https://github.com/owner/repo)" },
  );

export function parseGithubRepoUrl(value: string | null | undefined) {
  if (value === null || value === undefined) return { ok: true as const, value: null };
  const trimmed = value.trim();
  if (!trimmed) return { ok: true as const, value: null };
  const parsed = githubRepoUrlSchema.safeParse(trimmed);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid GitHub URL" };
  }
  return { ok: true as const, value: parsed.data.replace(/\/$/, "") };
}
