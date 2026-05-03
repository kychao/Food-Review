# SLO Bites — Tech Stack & Conventions

## Stack
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: PostgreSQL via Neon, accessed through Prisma 7 with `@prisma/adapter-pg`
- **Styling**: Tailwind CSS v4
- **AI**: Groq API (llama-3.1-8b-instant) for flavor profile inference
- **File uploads**: Local filesystem via `public/uploads/`
- **Email**: Nodemailer (SMTP placeholder — see TODO in `lib/email.ts`)

## Key Conventions
- Server components fetch from Prisma directly — no API round-trip needed
- Client components use `fetch` to call API route handlers under `app/api/`
- SQLite is used locally for development; Neon PostgreSQL is used in production
- The `NEON_DATABASE_URL` env var switches the database — if set, Neon is used; otherwise falls back to `DATABASE_URL`
- All images are stored in `public/uploads/` and served as static files
- Flavor profiles use a 0–100 scale: 0 = left label (savory/healthy/light), 100 = right label (sweet/indulgent/heavy)

## Project Structure
- `app/` — Next.js App Router pages and API routes
- `components/` — Reusable React components
- `lib/` — Shared utilities (prisma client, flavor engine, Groq AI)
- `prisma/` — Schema, migrations, and seed data
- `public/uploads/` — User-uploaded review images

## Database Models
- `Restaurant` → `MenuItem` → `Review` → `ReviewVote`
- `Report` links to either a `Review` or `MenuItem`
- Average ratings are computed at query time, never stored

## Do Not
- Add authentication — the app is intentionally open to all users
- Use `better-sqlite3` adapter in production — use `@prisma/adapter-pg` with Neon
- Store secrets in code — use environment variables
