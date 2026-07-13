# Agent workflow — Cohort PM Platform

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** PostgreSQL via Prisma
- **Auth:** Email/password with JWT httpOnly cookies
- **Deploy:** Vercel

## Role map

| Task type | Agent | Tool |
|-----------|-------|------|
| Requirements research | Research | Cursor Agent |
| Feature implementation | Development | Cursor Agent |
| Deploy / smoke test | QA | Human + Vercel |

## Conventions

- Branch: `participants/fall26/phase-1-project-1/RAVEN-dubgub` (per cohort platform)
- PR title: `[Project 1] Submission - RAVEN-dubgub`
- Run `npm run lint` and `npm run build` before requesting review

## This project

- Cursor Agent read `curriculum/phase-1/project-1-pm-platform/requirements.md` from the open-source cohort curriculum repo.
- Implemented baseline PM features plus dashboard motivation layer and due dates.
- Human steps remain: Neon database, Vercel env vars, production migration, cohort org PR.
