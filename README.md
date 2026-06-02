# SpeakVault v2.2

SpeakVault is a website-first English speaking product. It helps you turn Chinese thoughts into natural English, save useful expressions, practise speaking aloud, and keep a private practice history.

This phase is focused on a stable web product, not a native App Store release. Public visitors land on a professional website first, then sign in to use the training product.

## Routes

- `/` - public website homepage
- `/login` - sign in and create account
- `/app` - authenticated Practice, Generate, Library, Plan, and Profile product

## Current Product Scope

- Supabase email/password authentication
- Synced profile preferences for role, location, major, English style, visual style, and 7-day weekly plans
- AI expression generation from Chinese thoughts
- Private expression library with search, edit, delete, tags, alternatives, notes, and mastery status
- Voice practice with browser speech recognition, microphone recording, typed transcript fallback, and local audio playback
- AI practice evaluation with pronunciation, accent/style fit, fluency, naturalness, completeness, drills, better versions, and next steps
- Persisted practice history with transcripts, scores, feedback, input mode, and recording duration
- Mobile-first PWA shell with manifest and app icon
- User-selectable interface language: English or Chinese

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

Use `http://localhost:3000/login` for auth and `http://localhost:3000/app` for the authenticated product.

## Environment

Set these values locally and in Vercel:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.4-mini
```

Use `AI_PROVIDER=anthropic` for Claude or `AI_PROVIDER=openai` for OpenAI.

## Supabase Setup

Run these files in Supabase SQL Editor in this order:

1. `supabase/schema.sql`
2. `supabase/practice_sessions.sql`
3. `supabase/user_profiles.sql`

If you created `practice_sessions` before v2.0, also run:

```txt
supabase/practice_feedback.sql
```

## Verification

```bash
npm run typecheck
npm run build
```

Browser smoke test:

1. Visit `/` and confirm the public website loads without login.
2. Visit `/login` and sign in.
3. Confirm sign-in redirects to `/app`.
4. Visit `/app` while signed out and confirm it redirects to `/login`.
5. Update Profile role, location, English style, and visual style, then refresh and confirm they persist.
6. Generate 3 expressions from a Chinese thought.
7. Save one expression to Library.
8. Start practice from Library or Practice.
9. Save a typed transcript if microphone transcription is unavailable.
10. Confirm Practice history shows the saved attempt.
11. Mark a 7-day plan task complete.
12. Switch Light, Dark, and System visual styles.

## Deployment

Use `DEPLOYMENT.md` for the Vercel, Supabase, environment variable, and post-deploy smoke test checklist.

## Notes

The old static prototype files have been removed. The authoritative product is the Next.js app in `app/`.
