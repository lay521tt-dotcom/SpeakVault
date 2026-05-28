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
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
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

1. Deploy the app to Vercel with Supabase and OpenAI environment variables.
2. Add expression editing, delete, and mastery-status updates.
3. Add recording, transcription, and speaking feedback.
4. Add daily practice history and adaptive plan tracking.
