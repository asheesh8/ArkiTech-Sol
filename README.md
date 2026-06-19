# ArkiTech Business Finder

A focused internal tool for discovering local businesses from Google Maps data, reviewing their profile and recent reviews, onboarding a selected client, and scheduling a Google Meet appointment.

## Product flow

1. Search by business type and area, or paste a business website.
2. Inspect real Google Business Profile data returned by Outscraper.
3. Select a business and enter its client contact details.
4. Schedule onboarding in the built-in calendar using your reusable Meet link.
5. Send the client an email invite with an `.ics` attachment and Add to Google Calendar link.

The application does not substitute seeded or fake business results when providers are unavailable.

## Run locally

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Copy `.env.example` to `.env.local` and configure the Supabase URL and anon key. `.env.local` is ignored by Git.

## Supabase and provider setup

Follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). The two SQL schemas must be applied in this order:

1. `supabase/migrations/202606190001_sales_workspace.sql`
2. `supabase/migrations/202606190002_business_finder_onboarding.sql`

The new Edge Functions are:

- `business-search`: authenticated Outscraper Google Maps lookup and database normalization.
- `send-appointment-invite`: authenticated Resend delivery with Google Meet, Google Calendar, and `.ics` content.

Outscraper and Resend keys are server-only Supabase secrets. Never add them to a `VITE_` environment variable.

## Routes

- `/` — Business Finder, onboarding, and appointment agenda.
- `/login` — invite-only Supabase magic-link sign-in.

## Quality checks

```powershell
npm run lint
npx vitest run
npm run typecheck
npm run build
```

The production build remains installable as a PWA.
