# SpeakVault v1.0

SpeakVault is a personal English speaking web app for building a private vault of workplace-ready expressions, practising them aloud, and turning each practice attempt into feedback.

This v1.0 build is tailored for a Chinese native speaker in Auckland working as a tax accountant, with NZ/AU workplace English as the default style.

## Features

- Supabase email/password authentication
- AI expression generation from Chinese thoughts
- Searchable private expression library
- Categories, tags, alternatives, notes, and mastery status
- Browser speech recognition with `en-NZ` language mode
- Typed transcript fallback when microphone access is blocked
- AI practice evaluation with pronunciation, accent, naturalness, and completeness scores
- Accent focus and pronunciation drill suggestions for Chinese native speakers
- Practice history with persisted transcripts, scores, accent notes, and feedback
- Adaptive review queue and 30-day plan focus
- Mobile-first PWA shell with manifest and app icon

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

Set these values in `.env.local`:

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

Run these files in the Supabase SQL editor:

1. `supabase/schema.sql`
2. `supabase/practice_sessions.sql`

If you already created `practice_sessions` before v1.0, also run:

```txt
supabase/practice_feedback.sql
```

That migration adds feedback and accent-analysis persistence columns to existing projects.

## Verification

```bash
npm run typecheck
npm run build
```

## v1.0 Notes

The app gracefully handles temporary Supabase or AI failures. If AI feedback is unavailable, practice sessions still save with fallback scores. Accent analysis is based on transcript and likely pronunciation risks; true audio-waveform accent scoring can be added later with audio upload.
