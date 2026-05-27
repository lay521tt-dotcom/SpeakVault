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
