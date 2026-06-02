# SpeakVault Deployment Checklist

Use this checklist to deploy the first-phase Web App to Vercel.

## 1. Supabase

Run these SQL files in Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/practice_sessions.sql`
3. `supabase/user_profiles.sql`

Confirm these tables exist:

- `public.expressions`
- `public.practice_sessions`
- `public.user_profiles`

Confirm email/password auth is enabled in Supabase Auth.

## 2. Vercel

Create a Vercel project from this repository with:

- Framework preset: Next.js
- Root directory: `app-web`
- Build command: `npm run build`
- Install command: `npm install`

Set the production environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

If `AI_PROVIDER=openai`, `OPENAI_API_KEY` must be valid. If `AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY` must be valid.

## 3. Pre-Deploy Checks

Run locally:

```bash
npm run typecheck
npm run build
```

Do not commit `.env.local`.

## 4. Post-Deploy Smoke Test

On the deployed URL:

1. Open `/` and confirm the public website loads without requiring login.
2. Open `/login`, sign in or create an account, and confirm it redirects to `/app`.
3. Open Profile and confirm role, location, English style, and visual style load.
4. Change Visual style, refresh, and confirm it persists.
5. Generate 3 expressions.
6. Save one expression to Library.
7. Start practice and save a typed transcript.
8. Confirm the practice attempt appears in Recent practice.
9. Mark a 7-day plan task complete and refresh.
10. Sign out and confirm `/app` redirects to `/login`.
11. Confirm mobile browser layout is usable for both `/` and `/app`.

## 5. Known Phase-One Boundaries

- This is a Web App first, not a native App Store build.
- Voice recording is local playback; full waveform-level server analysis is not implemented yet.
- Browser speech recognition depends on browser support and microphone permission.
- AI cost is controlled by the configured provider account, not by in-app quotas yet.
