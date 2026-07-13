## Summary

Week 1 PM platform submission for the Hult Cohort Developer Program (Summer Pilot 2026).

## Production URL

<!-- REQUIRED: paste your live HTTPS URL -->

## Setup steps verified

- [ ] Fresh clone → `npm install` → configure `.env` → `npx prisma migrate deploy` → `npm run dev`
- [ ] Signup, create project, create task, assign to another user — all work on production URL

## Architecture summary

Next.js App Router on Vercel, Prisma ORM, PostgreSQL (Neon). JWT session auth. API routes for projects, tasks, users, metrics.

## Motivation / engagement design notes

Cohort snapshot dashboard with completion rate, next-actions panel, per-project progress bars, and overdue task counter.

## Known limitations

Email/password auth only; no OAuth, comments, or email notifications yet.

## Agent usage summary

<!-- Which agents/tools you used and what you verified yourself -->

- Cursor Agent: requirements research, implementation, docs
- Human: database provisioning, Vercel deploy, production smoke test

## Checklist (ballot eligibility)

- [ ] Public repo in cohort org
- [ ] README complete with deploy URL
- [ ] URL loads; reviewer can sign up and create + assign a task
- [ ] AGENTS.md present
- [ ] All baseline features demonstrable in ≤ 5 min
