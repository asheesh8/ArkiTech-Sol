# ArkiTech-Sol

Private sales and client operations PWA for Ashish and Terri.

## Run the UI demo

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

The app opens directly in a seeded demo workspace. Demo mode persists lead, email, payment, activity, and client changes in local storage. Use **Settings → Reset** to restore the seed.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

## Supabase setup

1. Open the Supabase SQL editor for your project.
2. Run `supabase/migrations/202606190001_sales_workspace.sql`.
3. In Authentication settings, disable public signups and invite only Ashish and Terri.
4. Set `VITE_ALLOWED_EMAILS` to those two comma-separated addresses.
5. Add each authenticated user to `profiles` with role `ashish` or `terri`.

Copy `.env.example` to `.env.local`. The local file is ignored by Git. Never expose the service-role, Stripe secret, webhook secret, or Resend key through a `VITE_` variable.

## Stripe and email

The Supabase Edge Functions in `supabase/functions` use:

- Stripe Checkout Sessions for recurring and one-time payments.
- Stripe webhooks to synchronize subscription and payment status.
- Resend's HTTPS API to send email and record it in `emails_sent` and `activities`.

Configure Edge Function secrets:

```powershell
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... STRIPE_REVIEWTAINER_PRICE_ID=... STRIPE_ULTRARETAINER_PRICE_ID=... RESEND_API_KEY=... RESEND_FROM_EMAIL="ArkiTech-Sol <ops@your-domain.com>"
```

Deploy:

```powershell
supabase functions deploy create-customer
supabase functions deploy create-subscription
supabase functions deploy cancel-subscription
supabase functions deploy charge-one-time
supabase functions deploy get-payment-history
supabase functions deploy send-email
supabase functions deploy webhook --no-verify-jwt
```

## Product routes

- `/` — command dashboard
- `/leads` and `/leads/:id` — lead pipeline and lead workspace
- `/pitch` — review lookup, competitor gap, pitch, and save flow
- `/clients` and `/clients/:id` — client, billing, payment, and review growth
- `/settings` — account and demo controls
- `/login` — invite-only Supabase magic link entry

The production build is PWA-enabled with iOS metadata, safe-area navigation, maskable icons, and an auto-updating service worker.
