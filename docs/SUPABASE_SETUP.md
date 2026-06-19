# Supabase setup for Business Finder

The app does not use fake business data. Complete this setup before running a real search or sending an invitation.

## 1. Apply the schemas

Open **Supabase → SQL Editor → New query** and run these files in order:

1. `supabase/migrations/202606190001_sales_workspace.sql`
2. `supabase/migrations/202606190002_business_finder_onboarding.sql`

## 2. Add frontend configuration

Copy `.env.example` to `.env.local` and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Never put the Outscraper, Resend, or Supabase service-role keys in a `VITE_` variable.

## 3. Add Edge Function secrets

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set OUTSCRAPER_API_KEY=YOUR_OUTSCRAPER_KEY
npx supabase secrets set RESEND_API_KEY=YOUR_RESEND_KEY
npx supabase secrets set "RESEND_FROM_EMAIL=ArkiTech <onboarding@YOUR_VERIFIED_DOMAIN>"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available to deployed Supabase Edge Functions.

## 4. Deploy the functions

```powershell
npx supabase functions deploy business-search
npx supabase functions deploy send-appointment-invite
```

## 5. Create authorized profiles

Create each salesperson in Supabase Auth, then insert a matching profile row using that Auth user UUID:

```sql
insert into public.profiles (id, name, email, role, meet_url, timezone)
values (
  'AUTH_USER_UUID',
  'Ashish',
  'ashish@example.com',
  'ashish',
  'https://meet.google.com/your-reusable-room',
  'America/New_York'
)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  meet_url = excluded.meet_url,
  timezone = excluded.timezone;
```

## 6. Verify

Sign in, search for a business category and area, select a result, schedule onboarding, and send an invite. Outscraper and Resend usage may incur provider charges.
