# Cohort PM Platform — RAVEN-dubgub

Hult Cohort Developer Program · **Week 1 · Project 1** submission.

Production project management platform for the cohort: projects, tasks, assignments, filters, and a motivation-focused progress dashboard.

## Production URL

> **Deploy this repo to Vercel and paste your live URL here before opening the submission PR.**

`https://YOUR-VERCEL-URL.vercel.app`

## Quick start (local)

### Prerequisites

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) free tier works)

### Setup

```bash
npm install
cp .env.example .env
# Edit .env with DATABASE_URL and AUTH_SECRET
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000 → **Sign up** → create a project → add tasks → assign peers.

### Signup for reviewers

Open registration is enabled. Peers sign up with any email/password (min 8 chars). For staff smoke-test during review week, create:

- Email: `staff-review@hult-cohort.test`
- Password: set in `#setup-verification` on Discord during review week

## Architecture

```
Browser (Next.js App Router)
  → API routes (/api/auth, /api/projects, /api/tasks, /api/metrics)
  → Prisma ORM
  → PostgreSQL (Neon / Vercel Postgres)
```

```text
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │ ─────────────► │  Next.js (Vercel) │
└─────────────┘                │  JWT session      │
                               └────────┬─────────┘
                                        │
                               ┌────────▼─────────┐
                               │   PostgreSQL    │
                               │ users/projects/ │
                               │     tasks       │
                               └─────────────────┘
```

### Data model

| Entity | Fields |
|--------|--------|
| **User** | email, name, password hash |
| **Project** | title, description, archived, owner |
| **Task** | title, description, status (todo/in progress/done), assignee, due date, project |

## Baseline features (rubric)

- [x] Projects — create, edit, archive; ≥1 per user
- [x] Tasks — title, description, status, assignee
- [x] Status workflow — todo / in progress / done
- [x] Assignment — assign to any cohort member by account
- [x] Multi-user auth — email + password; supports 30+ accounts
- [x] Task list views — filter by project, assignee, status
- [x] HTTPS deployment — Vercel-ready

## Differentiating features

- [x] Due dates on tasks
- [x] Cohort metrics dashboard (completion %, next actions, overdue count)
- [x] Progress bars per project
- [x] Mobile-responsive layout

## Motivation / engagement design

- **Cohort snapshot** dashboard shows completion rate and shipped tasks — social proof that the cohort is moving.
- **Next actions** panel surfaces your top 5 open assignments so you always know what to do now.
- **Per-project progress bars** make partial wins visible before everything is done.
- **Overdue counter** creates gentle urgency without nag emails.

## Deploy (Vercel)

1. Push this repo to GitHub (`pm-RAVEN-dubgub`, public, MIT).
2. Import in [Vercel](https://vercel.com/new).
3. Add environment variables:
   - `DATABASE_URL` — Neon pooled connection string
   - `AUTH_SECRET` — random 32+ char string (`openssl rand -base64 32`)
4. Deploy, then run migrations against production DB:
   ```bash
   DATABASE_URL="your-prod-url" npx prisma migrate deploy
   ```
5. Verify signup → project → task → assign flow on the live URL.

## Known limitations

- Email/password only (no OAuth yet)
- No in-app notifications or comments (due dates + dashboard only)
- No GitHub issue linking (stretch for later weeks)
- Requires manual `prisma migrate deploy` after first Vercel deploy

## Agent usage summary

Built with **Cursor Agent** (Claude):

- Researched requirements from `rogerSuperBuilderAlpha/hult-cohort-program` curriculum
- Scaffolded Next.js + Prisma + PostgreSQL stack
- Implemented auth, CRUD APIs, dashboard, and submission docs
- Human must: create Neon DB, deploy to Vercel, open submission PR to cohort org

## Submission

| Item | Value |
|------|-------|
| Repo | `hult-cohort-fall26-boston/pm-RAVEN-dubgub` (or your fork until org invite) |
| PR title | `[Project 1] Submission - RAVEN-dubgub` |
| Deadline | **Sunday Jul 19, 2026 · 17:00 ET** — PR merged to `main` |
| Platform page | https://site-nine-rouge-68.vercel.app/program/phase-1-project-1 |

PR body must include: Production URL, setup steps, architecture summary, motivation notes, known limitations, agent usage.

## License

MIT
