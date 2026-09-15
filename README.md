# 31G Operations Management System

Production backend for the 31G digital operations dashboard: **PostgreSQL + Prisma** for data,
**NextAuth (Credentials) + RBAC** for logins, deployed on **Vercel**.

The operating chain: **Client → Project → Vertical → Task → Team Member → Daily Workload → KPI → Report**.

## What changed from the prototype
- Replaced the in-memory `lib/data.ts` arrays with a Postgres schema (`prisma/schema.prisma`) and a real
  Prisma client (`lib/prisma.ts`).
- Added email/password login (`app/login`, `lib/auth.ts`) — every page and API route requires a session
  (`middleware.ts`).
- Added two roles: **ADMIN** and **MEMBER** (`lib/rbac.ts`). See the table below.
- Every task/project status change is now recorded to `TaskStatusEvent` / `ProjectStatusEvent`, and daily
  work is recorded to `DailyLog` — this is what powers real historical KPIs instead of static numbers.
- New endpoints: `POST /api/daily-logs` (record a day's work), `GET /api/kpis` (historical trend series).

## Roles (RBAC)
| Action | MEMBER | ADMIN |
|---|---|---|
| Log in, view dashboard/KPIs | ✅ | ✅ |
| Create/update tasks, assign work, change task status | ✅ | ✅ |
| Change project status | ✅ | ✅ |
| Record own daily work log | ✅ | ✅ |
| Create clients, projects, proposals | ✅ | ✅ |
| Delete clients/projects/tasks/proposals | ❌ | ✅ |
| Create/deactivate team member logins, change roles | ❌ | ✅ |

Adjust this in each route under `app/api/**/route.ts` (`requireUser` vs `requireAdmin` from `lib/rbac.ts`)
if you want a stricter split — e.g. only admins creating projects.

## Local setup
1. `npm install`
2. Create a Postgres database (see Deploy section — Neon/Vercel Postgres is easiest) and copy
   `.env.example` to `.env`, filling in `DATABASE_URL`, `DIRECT_URL`, and a generated `AUTH_SECRET`
   (`npx auth secret`).
3. `npm run db:migrate` — creates the tables.
4. `npm run db:seed` — loads sample clients/projects/tasks and creates team logins.
  **Every seeded account's password is `ChangeMe123!`** (see `prisma/seed.ts` for emails — e.g.
  `admin@31g.co.uk` is the admin account). Change these before real use.
5. `npm run dev` and sign in at `/login`.

## Deploy on Vercel
1. Push this repo to GitHub and import it in Vercel.
2. In the project's **Storage** tab, click **Create Database → Postgres** (Neon-backed). This
   automatically sets `DATABASE_URL` and `DIRECT_URL` as environment variables — no manual DB hunting.
3. Add one more environment variable: `AUTH_SECRET` (generate with `npx auth secret`).
4. Vercel will run `npm install` → `postinstall` (`prisma generate`) → `build`
   (`prisma generate && next build`) automatically.
5. Run the migration against the new database once, from your machine, pointed at the Vercel DB's
   connection string: `npx prisma migrate deploy`. Then seed it: `npm run db:seed`.
6. Redeploy (or it will already be live) — sign in at `/login` with a seeded account.

## Data model (`prisma/schema.prisma`)
`User` (login + role), `Client`, `Vertical`, `Project`, `Task`, `Proposal`, plus history tables
`TaskStatusEvent` / `ProjectStatusEvent` (every status change, who changed it, when) and `DailyLog`
(per-person, per-day task counts and hours) — these two are what let `/api/kpis` and the dashboard
compute real on-time %, quality, and trend charts instead of hardcoded numbers.

## API
- `GET/POST /api/clients`, `PATCH/DELETE /api/clients/[id]` — admin creates/edits/deletes
- `GET/POST /api/projects`, `PATCH/DELETE /api/projects/[id]` — status changes are logged automatically
- `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/[id]` — assignment + status changes logged automatically
- `GET/POST /api/team` (admin creates logins), `PATCH/DELETE /api/team/[id]` (admin edits/deactivates)
- `GET/POST /api/proposals`, `PATCH/DELETE /api/proposals/[id]`
- `GET/POST /api/daily-logs` — record/view a person's daily work
- `GET /api/kpis?days=30&userId=...` — historical KPI series
- `GET /api/dashboard` — combined payload the frontend renders
- `GET/POST /api/auth/[...nextauth]` — NextAuth (sign in/out, session)

## Notes / next steps you may want
- Passwords: seeded accounts share one password — add a "change password on first login" flow before
  giving this to the real team.
- Email invites: team creation currently just sets a password server-side; wire up an email invite
  flow if you don't want to hand out passwords manually.
- The frontend (`components/Dashboard.tsx`) still shows all actions to every signed-in member; it does
  not yet hide admin-only buttons (delete, team management) from MEMBER accounts — the API enforces RBAC
  either way, but you'll want to hide those controls in the UI too.
