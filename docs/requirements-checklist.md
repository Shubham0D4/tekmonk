# TekMonk implementation checklist

This checklist maps the supplied PRD and implementation brief to the source areas responsible for each capability. It is intentionally implementation-oriented, not a substitute for operational configuration.

## Reader experience

- [x] Editorial, responsive public home feed with a cold-start ranking route - `src/app/page.tsx`, `src/lib/recommendations.ts`.
- [x] Personalized tag-aware feed after a meaningful read or interaction - `src/lib/recommendations.ts`, `src/app/api/posts/[postId]/read/route.ts`.
- [x] Search, tags/topics, pagination, article detail, related stories, loading, empty, error, and not-found states - `src/app/**`, `src/components/public/**`.
- [x] Safe structured-content article rendering, reading time, author/date/tags, likes and bookmarks - `src/components/public/**`, `src/app/api/posts/**`.
- [x] Threaded comments, paragraph anchors, voting, and short-poll refresh - `src/components/public/comments.tsx`, `src/app/api/comments/**`.
- [x] SEO metadata, canonical URLs, Open Graph, JSON-LD, RSS, sitemap, and robots - `src/app/**`.

## Owner workspace

- [x] Server-protected owner dashboard, metrics, post listing/filtering and publishing controls - `src/app/admin/**`.
- [x] Arbitrarily nested folders, `.blg` records and folder-scoped media - `prisma/schema.prisma`, `src/app/admin/workspace/**`, `src/app/api/admin/**`.
- [x] Tiptap rich-text editor, formatting toolbar, preview, outline, word/read estimates, debounced save state, taxonomy and SEO controls - `src/components/admin/editor/**`.
- [x] Image validation, preview, uploads, unique paths, media associations and delete/replacement-safe server operations - `src/lib/storage.ts`, `src/app/api/admin/media/**`.
- [x] Category/tag administration, settings, contact-message visibility and comment moderation - `src/app/admin/**`, `src/app/api/admin/**`.

## Platform and security

- [x] Next.js App Router / TypeScript strict mode / reusable component architecture - `src/**`, `tsconfig.json`.
- [x] Prisma 7 on PostgreSQL with Better Auth's Prisma adapter and a strict `ADMIN` / `SUBSCRIBER` role boundary - `prisma/**`, `src/lib/auth*.ts`.
- [x] Email/password account flow, verification and recovery emails, Gmail SMTP transport - `src/lib/auth.ts`, `src/lib/email.ts`.
- [x] Input validation, server-side authorization, upload constraints, rate limits, no direct client service-role use, safe JSON content rendering, and unpublished-content filters - `src/lib/**`, `src/app/api/**`.
- [x] Supabase Storage setup/policy reference - `supabase/storage-policies.sql`.
- [x] Environment validation, safe environment template, migrations, seed data, unit tests, setup and deployment documentation - `.env.example`, `prisma/**`, `src/**/*.test.ts`, `README.md`.

## Operational verification still required

- [x] Run database migration against the target Supabase project after setting `DATABASE_URL` / `DIRECT_URL`.
  - Command: `npx prisma migrate deploy` (or `npm run prisma:migrate`) applied migration `20261029000000_initial`.
- [ ] Run the storage policy script in the target Supabase SQL editor.
  - File: `supabase/storage-policies.sql` — paste contents into the Supabase SQL editor for the target project.
- [ ] Configure the owner email and Gmail app password, then verify delivery with a real inbox.
  - Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in `.env.local`; use a Gmail app-password (not account password).
- [ ] Set `ADMIN_EMAIL` before creating the owner account; the first matching verified account is promoted by the documented setup flow.
- [ ] Validate email delivery, storage writes, and Better Auth flows against live credentials before production deployment.

## Tier 2 features implemented

- [x] Scheduled-post auto-publisher endpoint (`GET /api/admin/publish-scheduled`) with cron-secret header support — `src/app/api/admin/publish-scheduled/route.ts`.
- [x] Scheduler admin UI showing pending posts and a "Run publisher now" button — `src/app/admin/scheduler/page.tsx`, `src/app/admin/scheduler/scheduler-run-button.tsx`.
- [x] Media Library admin page with paginated grid, upload, and delete — `src/app/admin/media/page.tsx`, `src/app/admin/media/media-grid.tsx`.
- [x] Media API GET paginated (`?page=`) and DELETE handlers — `src/app/api/admin/media/route.ts`.
- [x] Comment moderation page with pin/unpin and delete — `src/app/admin/comments/page.tsx`, `src/app/admin/comments/comment-moderation-table.tsx`.
- [x] Comment moderation API (DELETE + PATCH isPinned) — `src/app/api/admin/comments/[commentId]/route.ts`.
- [x] Admin nav updated with Media, Scheduler, and Comments links — `src/components/admin/admin-nav.tsx`.
