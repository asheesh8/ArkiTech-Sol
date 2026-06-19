# ArkiTech-Sol — Claude Code Build Brief v2
## Internal Sales & Client Management Tool (iOS PWA + Desktop)

---

## WHAT THIS IS

A private internal tool for Ashish and Terri only. No client-facing portal. No business owner ever logs in. This is the tool they use to close sales, charge clients, and manage everything after the deal is done.

Think of it like HomeSHINE — a field ops tool — but for running ArkiTech-Sol itself.

Two users total: Ashish and Terri. That's it.

---

## WHAT IT DOES

1. **Review Lookup Tool** — pull any business's Google review data on the spot during a cold call
2. **Lead Pipeline** — track every business they've approached and where it stands
3. **Client Management** — once closed, each business gets a profile with all their info, plan, billing, and history
4. **Stripe Integration** — charge clients monthly recurring right from the app, set up subscriptions, track payments
5. **Email Actions** — send follow-up emails, new job proposals, and check-ins directly from a client or lead's profile
6. **Activity Log** — every call, visit, email, note logged per business so nothing falls through the cracks

---

## STACK

- React + Vite + TypeScript
- Tailwind CSS + custom design tokens
- Framer Motion (all animations)
- Supabase (database + auth — just two users, Ashish and Terri)
- Stripe (subscriptions + one-time payments)
- Resend (email sending via API)
- vite-plugin-pwa (iOS installable)
- Vercel (deploy target)
- Zustand (global state)
- Lucide React (icons)
- Recharts (charts)
- react-router-dom
- react-hot-toast

---

## BRAND & DESIGN

**Design reference:** Linear.app, Vercel dashboard. Dark, clean, fast, no clutter.

**Colors:**
- Background: `#0A0A0F`
- Surface: `#111118`
- Card: `#16161F`
- Border: `#1E1E2E`
- Accent Blue: `#4F8EF7`
- Accent Purple: `#7C5CFC`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Text Primary: `#F0F0FF`
- Text Secondary: `#8888AA`
- Text Muted: `#44445A`

**Font:** Inter — weights 300, 400, 500, 600, 700

**Cards:** 12px radius, 1px border `#1E1E2E`, hover shifts border to `#2E2E4E`

**Buttons:** Scale 0.97 on press, blue glow on hover for primary

---

## PWA (iOS HOME SCREEN)

```json
{
  "name": "ArkiTech-Sol",
  "short_name": "ArkiTech",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0F",
  "theme_color": "#0A0A0F",
  "orientation": "portrait-primary"
}
```

- `apple-mobile-web-app-capable` meta tag
- `apple-mobile-web-app-status-bar-style: black-translucent`
- apple-touch-icon set
- Safe area insets with `env(safe-area-inset-*)` everywhere
- Bottom nav clears iPhone home indicator

---

## SUPABASE SCHEMA

```sql
-- Just two users — handled by Supabase Auth + this profile table
create table profiles (
  id uuid references auth.users primary key,
  name text, -- 'Ashish' or 'Terri'
  role text check (role in ('ashish', 'terri'))
);

-- Every business they've cold called or plan to
create table leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  owner_name text,
  phone text,
  email text,
  address text,
  city text,
  business_type text,
  google_rating numeric(2,1),
  google_review_count integer,
  competitor_data jsonb, -- stores snapshot of nearby competitor ratings
  notes text,
  status text check (status in (
    'not_contacted', 'pitched', 'follow_up', 'trial', 'closed', 'lost'
  )) default 'not_contacted',
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Converted clients — each one is a business ArkiTech-Sol is actively working with
create table clients (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  business_name text not null,
  owner_name text,
  phone text,
  email text,
  address text,
  business_type text,
  plan text check (plan in ('trial', 'reviewtainer', 'ultraretainer', 'custom')),
  contract_term text check (contract_term in ('monthly', '6month', '12month', 'ip_buyout')),
  monthly_value numeric(8,2),
  stripe_customer_id text,        -- Stripe customer ID
  stripe_subscription_id text,    -- Stripe subscription ID
  subscription_status text,       -- active, past_due, canceled, trialing
  trial_ends_at date,
  contract_start date,
  contract_end date,
  next_billing date,
  brought_by uuid references profiles(id), -- who closed this deal
  notes text,
  status text check (status in ('active', 'paused', 'churned')) default 'active',
  created_at timestamptz default now()
);

-- Every touchpoint: calls, visits, emails, notes, status changes
create table activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  user_id uuid references profiles(id),
  type text check (type in ('call', 'visit', 'email', 'note', 'status_change', 'payment')),
  content text,
  created_at timestamptz default now()
);

-- Email log — every email sent from the app
create table emails_sent (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  client_id uuid references clients(id),
  sent_by uuid references profiles(id),
  to_email text,
  subject text,
  body text,
  type text check (type in ('follow_up', 'proposal', 'check_in', 'invoice', 'custom')),
  sent_at timestamptz default now()
);

-- Payments / commission tracking
create table payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  stripe_payment_intent_id text,
  amount numeric(8,2),
  status text, -- succeeded, failed, pending
  type text check (type in ('subscription', 'one_time')),
  closed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Review snapshots over time per client (to show growth)
create table review_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  rating numeric(2,1),
  review_count integer,
  pulled_at timestamptz default now()
);
```

---

## STRIPE INTEGRATION

Use Stripe's Node.js SDK via Supabase Edge Functions.

**Edge functions needed:**

```
supabase/functions/
  create-customer/        -- create Stripe customer when lead converts to client
  create-subscription/    -- start ReviewTainer or UltraRetainer subscription
  cancel-subscription/    -- cancel a client's subscription
  charge-one-time/        -- one-off payment (custom project, IP buyout)
  get-payment-history/    -- pull all charges for a client from Stripe
  webhook/                -- handle Stripe webhooks (payment success, failure, cancellation)
```

**Plans (hardcoded Stripe price IDs — set these up in Stripe dashboard first):**
- ReviewTainer: $197/mo recurring
- UltraRetainer: $347/mo recurring
- Custom: one-time flat fee (variable amount input)

**In the app:**
- "Charge Client" button on every client profile
- Select plan → confirm → Stripe subscription created
- Payment status shown on client card (active / past due / canceled)
- Payment history tab on client detail page
- Failed payment shows warning badge on client card

---

## EMAIL INTEGRATION (Resend)

Use Resend API for all outbound email.

**Email types with pre-built templates:**

```
Follow Up     — "Hey [Owner], just circling back after we spoke..."
New Job       — "We'd love to propose [service] for [Business]..."
Check In      — "Hi [Owner], quick check in — how are things going?..."
Invoice       — "Here's your invoice for [month] — [amount] due..."
Free Trial    — "Your 30-day free trial starts today. Here's what to expect..."
Custom        — blank compose with subject + body
```

**On lead/client profile:**
- Email button → opens slide-up compose sheet
- Select template or write custom
- Edit before sending
- Sends via Resend
- Logs to `emails_sent` table automatically
- Shows in activity timeline

---

## PAGES

### Login (`/login`)
- Full screen dark page, ArkiTech-Sol logo centered
- Supabase magic link auth
- Only Ashish and Terri's emails work — reject anyone else with "Access denied"
- Smooth fade-in

---

### Dashboard (`/`)

**Stat cards:**
- Total active clients
- MRR (sum of all active client monthly values)
- Leads in pipeline
- Deals closed this month

**My assignments:**
- Leads assigned to logged-in user, grouped by status
- Quick status-change pills

**Recent activity feed:**
- Last 15 activities across all leads + clients
- Shows type icon, who did it, what business, when

**Quick actions:**
- Add Lead
- Open Review Tool
- New Email

---

### Review Tool (`/pitch`)

This is the cold call weapon. Pull it up in front of a prospect.

**Step 1 — Search**
- Search bar: business name + city
- Pulls Google Business Profile data via Places API (or SerpApi if Places is restricted)
- Shows: rating, review count, last review date, response rate, business hours, category

**Step 2 — Competitor View**
- Auto-pulls 2-3 nearby businesses in same category
- Side-by-side comparison: ratings, review counts
- Visual bar showing the gap
- "You have X reviews. [Competitor] down the street has Y."

**Step 3 — Generated Pitch Script**
- Auto-fills real numbers into a script
- Large readable text for glancing while talking
- Sections: Hook / Problem / Solution / Free Trial Close
- Copy to clipboard

**Step 4 — Save as Lead**
- Pre-fills new lead form with pulled business data
- One tap to save and jump to lead profile

---

### Leads (`/leads`)

**Filter bar (sticky):**
- Status pills: All / Not Contacted / Pitched / Follow Up / Trial / Closed / Lost
- Assigned: Me / Terri / All
- Search

**Lead cards:**
- Business name + type
- Google rating stars + count (if pulled)
- Status badge (color coded)
- Assigned avatar (A or T)
- Last activity time
- Tap → Lead Detail

**FAB:** Add Lead (bottom right, mobile)

---

### Lead Detail (`/leads/:id`)

**Header:** Business name, status badge (tap to change), assigned to (tap to reassign)

**Review Snapshot card:**
- Current rating + count
- Pull / refresh button
- Competitor comparison inline

**Info:** Owner, phone (tap to call), email, address, business type

**Action buttons:**
- Call (opens dialer)
- Email (opens compose sheet)
- Convert to Client (opens plan selection modal → triggers Stripe customer creation)

**Pitch Script button:** Opens full pitch sheet pre-filled with this business's data

**Activity Timeline:**
- All calls, visits, emails, notes, status changes
- Add activity: type + note
- Email log entries show subject + preview

---

### Clients (`/clients`)

**Client cards:**
- Business name
- Plan badge: Trial / ReviewTainer / UltraRetainer / Custom
- MRR value
- Subscription status (active / past due / canceled) — color coded
- Days until next billing
- Brought by avatar

**Filter:** Plan / Status / Brought by

---

### Client Detail (`/clients/:id`)

**Header:** Business name, plan badge, status

**Billing card:**
- Current plan + monthly value
- Subscription status (pulls live from Stripe)
- Next billing date
- "Charge Now" button (one-time)
- "Change Plan" button
- "Cancel Subscription" button (confirm required)

**Payment History tab:**
- All Stripe charges for this client
- Amount, date, status, type

**Review Growth chart:**
- Line chart (Recharts) of review count over time using review_snapshots
- Rating trend line

**Contact info:** Owner, phone (tap to call), email, address

**Email button:** Opens compose sheet with client pre-filled

**Notes:** Free text field, auto-saves

**Activity Timeline:** All touchpoints for this client

**Email History tab:** All emails sent to this client

---

### Settings (`/settings`)

- Profile name
- Sign out
- App version

---

## NAVIGATION

**Mobile (bottom tab bar):**
```
Dashboard | Leads | Review Tool | Clients | Settings
```
- Safe area padding
- Active: accent blue + label
- Inactive: muted
- Slide indicator animation between tabs

**Desktop (left sidebar 240px):**
- Logo top
- Nav items with icons + labels
- Active: blue left border + subtle background
- Bottom: user name + sign out
- Collapsible to icon-only

---

## ANIMATIONS

```typescript
// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
}

// Staggered list
const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } }
}
const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
}

// Mobile slide-up sheet
const sheetVariants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { y: '100%' }
}
```

- Stat counters animate 0 → value on mount
- Skeleton loaders on all data fetches
- Toast notifications for all actions
- Swipe left on lead card → quick actions (call, reassign, archive)
- Long press on mobile → context menu

---

## UX RULES

1. Phone numbers always `tel:` links on mobile — one tap to call
2. Every destructive action requires confirmation modal
3. Forms auto-save draft to localStorage
4. Offline banner: "You're offline — changes sync when reconnected"
5. Empty states always have illustration + CTA
6. Skeleton loaders always, never blank screens
7. Errors always show retry button
8. Search is instant client-side filtering
9. Pull-to-refresh on all lists
10. All email sends log to activity timeline automatically

---

## INSTALL COMMANDS

```bash
npm create vite@latest arkitech-sol -- --template react-ts
cd arkitech-sol
npm install
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
npm install framer-motion @supabase/supabase-js zustand lucide-react recharts react-router-dom vite-plugin-pwa react-hot-toast date-fns clsx tailwind-merge stripe resend
```

---

## ENV

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_GOOGLE_PLACES_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # edge functions only
STRIPE_SECRET_KEY=               # edge functions only
STRIPE_WEBHOOK_SECRET=           # edge functions only
RESEND_API_KEY=                  # edge functions only
```

---

## DELIVERABLES CHECKLIST

- [ ] PWA installable on iOS
- [ ] Supabase auth — Ashish + Terri only, reject all others
- [ ] All pages built and routed
- [ ] Review Tool working (Places API or SerpApi mock)
- [ ] Stripe subscriptions — create, cancel, charge, webhook handler
- [ ] Resend email — all templates, compose sheet, activity log
- [ ] Lead pipeline with full CRUD
- [ ] Client management with full CRUD
- [ ] Payment history per client (live from Stripe)
- [ ] Review growth chart per client
- [ ] Activity timeline on every lead + client
- [ ] Mobile bottom nav + desktop sidebar
- [ ] Framer Motion on all transitions + lists
- [ ] Skeleton loaders on all async data
- [ ] Toast notifications on all actions
- [ ] Fully responsive — mobile, tablet, desktop
- [ ] Vercel deploy ready

---

*ArkiTech-Sol internal tool — Ashish & Terri only. 2026*
