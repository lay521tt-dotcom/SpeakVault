# Changelog

## v2.2.0 - 2026-05-31

- Added synced user profiles for role, major, location, English style, and visual style.
- Replaced the 30-day plan copy with a persistent 7-day weekly plan, day completion tracking, and Monday rollover after completion.
- Passed profile context into AI expression generation and practice evaluation.
- Added light, dark, and system visual style modes.
- Added Supabase setup SQL for `user_profiles`.
- Removed the old static prototype files so the Next.js Web App is the only product entrypoint.
- Added a first-phase Web deployment checklist and smoke test guide.
- Tightened empty-input button states for expression generation and typed practice saving.

## v2.1.0 - 2026-05-29

- Added user-selectable system language with English and Chinese interface text.
- Persisted language choice in local storage and updates the document language.
- Added language controls on login and profile screens.
- Added production deployment checklist for Vercel/Supabase handoff.
- Updated docs and package version for v2.1.

## v2.0.0 - 2026-05-29

- Added real microphone audio recording with local playback.
- Added voice vs typed practice mode tracking.
- Added recording duration tracking for practice sessions.
- Added fluency score and audio note to AI feedback.
- Expanded accent-analysis persistence fields and migration SQL.
- Updated docs and package version for v2.0.

## v1.0.0 - 2026-05-29

- Added Supabase authentication and private expression storage.
- Added Claude/OpenAI expression generation from Chinese thoughts.
- Added searchable expression library with edit, delete, status, tags, notes, and alternatives.
- Added speech practice with browser transcription and typed transcript fallback.
- Added AI practice evaluation with scores, better version, and next step.
- Added transcript-based accent focus and pronunciation drills.
- Added persisted practice feedback fields and migration SQL.
- Added adaptive review queue and plan focus.
- Added PWA manifest icon and production setup documentation.
- Hardened Supabase network error handling so development overlays do not block the app.
