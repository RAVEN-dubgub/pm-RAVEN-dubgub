# Cohort PM Platform — RAVEN-dubgub

Hult Cohort Developer Program · **Week 1 · Project 1** submission.

**Purpose:** motivate cohort work through visible progress and peer assignment — not solo task tracking. The dashboard shows cohort-wide completion, who is actively shipping, recent wins, and tasks peers assigned to you so accountability stays social.

Production project management platform for the cohort: projects, tasks, assignments, filters, and a motivation-focused progress dashboard.

## Production URL

`https://pm-raven-dubgub.vercel.app`

> **Note:** Set `DATABASE_URL` + `AUTH_SECRET` on Vercel and run `prisma migrate deploy` for a working DB — see [DEPLOY.md](./DEPLOY.md).

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
| **Task** | title, description, status, **priority**, assignee, due date, **blockedBy**, project |

## Grader test instructions

1. Open **https://pm-raven-dubgub.vercel.app** → Sign up (or log in).
2. **Dashboard** → expand **How to use this app**; confirm chart shows tasks by status.
3. **Projects** → create a project → open it via card link (filters Tasks by `projectId`).
4. **Tasks** → create task with **High** priority and assign to another user (not “(you)”).
5. Create a second task → set **Blocked by** the first → confirm **Blocked** badge until first is Done.
6. Toggle **Board** view → change status via dropdown on a card → column updates.
7. Filter by **Priority: High** → only high-priority tasks show.
8. Archive a task → enable **Show archived only** → restore.

Staff smoke account (`staff-review@hult-cohort.test`) projects appear muted at the bottom of the project list.

## Baseline features (rubric)

- [x] Projects — create, edit, archive; ≥1 per user
- [x] Tasks — title, description, status, assignee, **priority**, **blockers**
- [x] Status workflow — todo / in progress / done
- [x] Assignment — assign to any cohort member by account (dropdown labels peers vs **(you)**)
- [x] Multi-user auth — email + password; supports 30+ accounts
- [x] Task list views — filter by project, assignee, status, **priority**; **List | Board** kanban toggle
- [x] HTTPS deployment — Vercel-ready

## Tier 1 features (Jul 2026)

- [x] **Priority** — Low / Medium / High on create & edit; color badges; filter on Tasks page
- [x] **Kanban board** — Board view with To do / In progress / Done columns; click status to move; horizontal scroll on mobile
- [x] **Task blockers** — optional “Blocked by” (same project); **Blocked** badge until blocker is Done; circular deps rejected
- [x] **Dashboard chart** — tasks-by-status bar chart + completion % + overdue count (CSS, no chart library)
- [x] **In-app help** — collapsible “How to use” on Dashboard (create project → task → assign peer → archive vs delete)
- [x] Smoke/test projects de-emphasized in default project list (sorted last, muted styling)

## Tier 2 features — PMP habits (Jul 2026)

Inspired by [r/PMP community habits](https://www.reddit.com/r/pmp/) (proactive risk communication, standups, definition of done, weekly stakeholder updates):

- [x] **At-risk project flag** — owners mark projects at risk; cohort dashboard surfaces flagged projects with status notes
- [x] **Weekly cohort update** — project owners post a short weekly update (risks, blockers, next steps); dashboard nudges if stale > 7 days
- [x] **Definition of done** — optional per-task completion criteria so “done” means outcome, not just activity
- [x] **Standup check-in** — assignees on in-progress tasks log a quick check-in note; dashboard nudges if stale > 2 days

## Differentiating features

- [x] Due dates on tasks
- [x] Cohort metrics dashboard (completion %, next actions, overdue count)
- [x] Progress bars per project
- [x] Mobile-responsive layout

## Motivation / engagement design

Research-backed UX (progress visibility, peer accountability, onboarding checklists):

- **Cohort momentum hero** — cohort-wide completion %, active members, motivating copy
- **Your contribution panel** — personal tasks shipped + share of cohort completions
- **Peer accountability** — "From [name]" badges on peer-assigned tasks; dashboard nudge for unstarted peer work
- **Recent cohort wins** — live feed of tasks the team just completed
- **Onboarding checklist** — 4-step setup guide for new cohort members (project → task → assign peer)
- **Overdue alert banner** — framed as helping the cohort stay on track
- **Project momentum panel** — per-project progress bars on the dashboard
- **PM habit nudges** — weekly update + standup check-in reminders on dashboard (r/PMP-inspired)
- **At-risk projects panel** — visible early escalation for cohort stakeholders
- **Status pills + due-soon badges** — clearer task scanning
- **Empty states with CTAs** — no blank walls when projects/tasks are missing
- **Mobile nav** — bottom tab bar + collapsible menu for small screens

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
