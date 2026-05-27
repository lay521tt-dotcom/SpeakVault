# SpeakVault

SpeakVault is a personal English speaking web app for building a private vault of workplace-ready expressions.

The current version is a Next.js clickable product foundation with:

- Email-style login prototype
- Practice dashboard
- Chinese thought to English expression generation prototype
- Searchable expression library
- Adaptive 30-day plan screen
- Profile and preference screen
- Mobile-first PWA metadata

## Run Locally

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase Setup

Run the SQL in [supabase/schema.sql](supabase/schema.sql) inside the Supabase SQL editor.

This creates:

- `expressions` table
- `mastery_status` enum
- row-level security policies so each user can only access their own expressions
- indexes for library queries
- `updated_at` trigger

## Verification

```bash
npm run typecheck
npm run build
```

## Next Milestones

1. Add Supabase authentication and database tables.
2. Replace mock expression generation with an OpenAI-backed API route.
3. Store saved expressions per user.
4. Add recording, transcription, and speaking feedback.
