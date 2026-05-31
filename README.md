# SpeakVault v2.2

SpeakVault is a first-phase English speaking Web App. It helps you turn Chinese thoughts into natural English, save useful expressions, practise speaking aloud, and keep a private practice history.

This phase is focused on a stable personal web product, not a native App Store release. Use it from a desktop or mobile browser first; once the web flow is mature, it can be wrapped or rebuilt as an app.

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

1. Sign in.
2. Update Profile role, location, English style, and visual style, then refresh and confirm they persist.
3. Generate 3 expressions from a Chinese thought.
4. Save one expression to Library.
5. Start practice from Library or Practice.
6. Save a typed transcript if microphone transcription is unavailable.
7. Confirm Practice history shows the saved attempt.
8. Mark a 7-day plan task complete.
9. Switch Light, Dark, and System visual styles.

## Deployment

Use `DEPLOYMENT.md` for the Vercel, Supabase, environment variable, and post-deploy smoke test checklist.

## Notes

The old static prototype files have been removed. The authoritative product is the Next.js app in `app/`.
