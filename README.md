# SLO Bites 🌿

**Cal Poly Campus Dining Reviews** — Built at KiroHacks 2025

SLO Bites is a web app for Cal Poly students to browse on-campus dining restaurants, read and submit item-level reviews, discover trending food, and find their next meal using an AI-powered craving matcher.

🔗 **Live site:** https://slo-bites.onrender.com

---

## Features

- **Browse restaurants & menus** — View all Cal Poly dining spots and their menu items with community ratings
- **Item-level reviews** — Rate and review individual menu items with photos, flavor sliders, and like/dislike voting
- **Add missing items** — Submit menu items that aren't listed yet; if the item already exists, your review attaches to it automatically
- **AI Cravings Matcher** — Set flavor sliders (savory/sweet, healthy/indulgent, light/heavy) and swipe through AI-ranked food recommendations that adapt in real time based on your responses
- **Community feed** — See the 50 most recent reviews across all restaurants
- **Hot carousel** — Homepage highlights recently trending high-rated items with photos
- **Search** — Find restaurants and menu items by name from any page
- **Flavor profiles** — Community-averaged flavor data displayed per menu item, powered by Groq AI for items without community data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL via Neon (hosted) |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Styling | Tailwind CSS v4 |
| AI | Groq API (llama-3.1-8b-instant) |
| Image storage | Cloudinary |
| Hosting | Render |

---

## Kiro Usage

This project was built using Kiro's spec-driven development workflow:

- **Spec** — Requirements, design, and tasks documented in `.kiro/specs/cal-poly-dining-reviews/`
- **Steering** — Tech stack conventions in `.kiro/steering/tech-stack.md`
- **Hooks** — Lint on save and accessibility checks in `.kiro/hooks/`

---

## Running Locally

### Prerequisites
- Node.js 20+
- A Neon PostgreSQL database (or use SQLite locally)
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- A Cloudinary account (free at [cloudinary.com](https://cloudinary.com))

### Setup

```bash
# Clone the repo
git clone https://github.com/kychao/Food-Review.git
cd Food-Review

# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database with Cal Poly restaurants
npx tsx prisma/seed.ts

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `NEON_DATABASE_URL` | PostgreSQL connection string from Neon |
| `DATABASE_URL` | Local SQLite fallback (`file:./prisma/dev.db`) |
| `GROQ_API_KEY` | Groq API key for AI flavor inference |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

See `.env.example` for the full template.

---

## License

MIT
