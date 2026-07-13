# Deploy guide — Cohort PM (Neon + Vercel)

One-time production setup. Estimated time: ~10 minutes.

## Prerequisites

- GitHub repo pushed: `https://github.com/RAVEN-dubgub/pm-RAVEN-dubgub`
- Vercel account linked to GitHub (CLI already logged in as `raven-dubgub`)
- Neon account (free tier): https://neon.tech

---

## Step 1 — Create Neon database

1. Go to https://console.neon.tech → **New Project**
2. Name: `pm-raven-dubgub` (or similar)
3. Copy the **pooled** connection string (ends with `-pooler` host)
4. Ensure `?sslmode=require` is in the URL

Example shape:

```text
postgresql://USER:PASSWORD@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Step 2 — Set Vercel environment variables

Project: `raven-dubgubs-projects/pm-raven-dubgub`

### Option A — Vercel Dashboard

1. https://vercel.com/raven-dubgubs-projects/pm-raven-dubgub/settings/environment-variables
2. Add for **Production**, **Preview**, and **Development**:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Neon pooled connection string |
| `AUTH_SECRET` | Random 32+ char string (see below) |

Generate `AUTH_SECRET` (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Or Git Bash / WSL:

```bash
openssl rand -base64 32
```

### Option B — Vercel CLI (copy-paste)

Replace placeholders, then run from repo root:

```powershell
cd c:\Users\wolfs\OneDrive\Documents\Cursor\pm-raven-dubgub

# DATABASE_URL — paste Neon pooled URL when prompted
npx vercel env add DATABASE_URL production
npx vercel env add DATABASE_URL preview
npx vercel env add DATABASE_URL development

# AUTH_SECRET — paste generated secret when prompted
npx vercel env add AUTH_SECRET production
npx vercel env add AUTH_SECRET preview
npx vercel env add AUTH_SECRET development
```

---

## Step 3 — Run Prisma migrations on production DB

From repo root, with your Neon `DATABASE_URL`:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASS@ep-xxx-pooler.../neondb?sslmode=require"
npx prisma migrate deploy
```

Expected output: `All migrations have been successfully applied.`

---

## Step 4 — Deploy to Vercel

```powershell
npx vercel --prod --yes
```

Or push to `main` — GitHub integration auto-deploys once env vars exist.

---

## Step 5 — Verify live app

1. Open production URL (shown after deploy, e.g. `https://pm-raven-dubgub.vercel.app`)
2. **Sign up** with a test account
3. Create a project → add a task → assign to a peer
4. Check **Dashboard** for cohort completion bar and onboarding checklist

---

## Step 6 — Update README

Replace the placeholder in `README.md`:

```markdown
## Production URL

`https://YOUR-ACTUAL-URL.vercel.app`
```

Commit and push.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 500 on signup/login | `DATABASE_URL` missing or migrations not run |
| "Unauthorized" everywhere | `AUTH_SECRET` not set on Vercel |
| Build fails on Vercel | Check build logs; `postinstall` runs `prisma generate` |
| Local dev | Copy `.env.example` → `.env`, use Neon dev branch URL |

---

## Neon CLI (optional)

If you prefer CLI after browser login:

```powershell
npx neonctl auth
npx neonctl projects create --name pm-raven-dubgub
npx neonctl connection-string --pooled
```

---

## Current automation status

| Step | Status |
|------|--------|
| Vercel project linked | Done (`pm-raven-dubgub`) |
| GitHub connected | Done |
| Neon DB created | **Manual** — browser auth required |
| Env vars on Vercel | **Manual** — not set yet |
| Prisma migrate (prod) | **Manual** — after Neon URL |
| Production deploy | Run Step 4 after env vars |
