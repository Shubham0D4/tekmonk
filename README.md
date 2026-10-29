# TekMonk

A personal blog platform built with Next.js, TypeScript, Prisma, and Supabase — featuring a rich TipTap editor, comment threads, likes, bookmarks, and newsletter support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| Database ORM | Prisma 7 (PostgreSQL / Supabase) |
| Authentication | Better Auth |
| File Storage | Supabase Storage |
| Rich Editor | TipTap 3 |
| Email | Nodemailer (Gmail SMTP) |
| Testing | Vitest 4 |

---

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **pnpm** or **npm** (npm scripts used throughout this README)
- A **Supabase project** (free tier is sufficient) — [supabase.com](https://supabase.com)
- A **Gmail App Password** for outgoing email — [generate one here](https://myaccount.google.com/apppasswords)

---

## Environment Setup

### 1. Copy the template

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in every placeholder. The sections below explain each group.

### Database Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string (used at runtime via pgBouncer) |
| `DIRECT_URL` | Direct Postgres connection (used by `prisma migrate`) |

Both values are available in your Supabase project under **Project Settings → Database**.

### Better Auth Variables

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | 32-byte hex secret for signing sessions — generate with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Canonical public URL of your app (e.g. `http://localhost:3000` locally) |

### Site URL

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Used for Open Graph tags, sitemap generation, and email deep-links |

### Supabase Storage Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project's API URL (safe for browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for browser; row-level security enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Full storage access — **server-side only, never expose to clients** |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name (default: `blog-media`) |

### SMTP / Email Variables

| Variable | Purpose |
|---|---|
| `SMTP_HOST` | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Port — `465` for SSL, `587` for STARTTLS |
| `SMTP_USER` | Gmail address used to send mail |
| `SMTP_PASS` | Gmail App Password (not your login password) |
| `SMTP_FROM` | Display address, e.g. `TekMonk <you@gmail.com>` |

### Admin Variables

| Variable | Purpose |
|---|---|
| `ADMIN_EMAIL` | The email that is auto-promoted to `ADMIN` role on first sign-up |

---

## Database Setup

### Run migrations

```bash
npm run prisma:migrate
# or for production (no prompts):
npx prisma migrate deploy
```

### Seed initial data (optional)

```bash
npm run prisma:seed
```

---

## Supabase Storage Setup

Run the bundled SQL once in the **Supabase SQL Editor** to create the storage bucket and policies:

```bash
# Open supabase/storage-policies.sql in the Supabase dashboard SQL editor and execute it.
```

The script creates a public `blog-media` bucket (max 5 MB, image types only). All writes are performed server-side via the service-role key — no browser upload policies are required.

---

## Local Development

```bash
npm install
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

---

## Admin Account Setup

1. Set `ADMIN_EMAIL` in `.env.local` to the email address you want as admin.
2. Navigate to [http://localhost:3000/sign-up](http://localhost:3000/sign-up) and create an account using **that exact email**.
3. Better Auth will automatically promote the account to the `ADMIN` role on creation.

> **Note:** The comparison is case-insensitive — the app lowercases `ADMIN_EMAIL` before matching.

---

## Available npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server (requires build) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check (no emit) |
| `npm run test` | Run Vitest unit tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:validate` | Validate `schema.prisma` |
| `npm run prisma:migrate` | Run `prisma migrate dev` (creates a new migration) |
| `npm run prisma:seed` | Seed the database via `prisma/seed.ts` |

---

## Deployment (Vercel)

1. **Import** your repository in the [Vercel dashboard](https://vercel.com/new).
2. **Add environment variables** — copy all entries from `.env.example`, fill in production values, and paste them into Vercel's *Environment Variables* settings.
3. **Run migrations against the production database** before the first deploy (or in a CI step):

   ```bash
   DATABASE_URL="<pooled-prod-url>" DIRECT_URL="<direct-prod-url>" npx prisma migrate deploy
   ```

4. Vercel will detect Next.js automatically and run `npm run build` during deployment.

> **Tip:** Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://tekmonk.dev`) — this ensures OAuth redirects and email links resolve correctly.

---

## Security Notes

- **`SUPABASE_SERVICE_ROLE_KEY`** is never included in the browser bundle. All storage mutations go through Next.js Route Handlers that run server-side only.
- **Rate limiting** is applied in-process (via `src/lib/rate-limit.ts`) on contact form submissions and other sensitive endpoints. For multi-instance deployments, replace the in-memory store with Redis.
- **`BETTER_AUTH_SECRET`** must be a cryptographically random value. Rotating it invalidates all active sessions.
- The `ADMIN_EMAIL` mechanism is suitable for single-admin blogs. For multi-admin setups, promote users directly via the database or a dedicated admin API.
- Passwords are hashed by Better Auth using Argon2 — never stored in plaintext.
- The `website` field in the contact form schema is a honeypot (max length 0) to filter bots.
