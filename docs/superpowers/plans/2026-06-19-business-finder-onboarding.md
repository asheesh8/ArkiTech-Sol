# Business Finder and Client Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo dashboard with a real Outscraper-powered business finder that onboards clients, schedules appointments, and sends reusable Google Meet invitations.

**Architecture:** The React root route becomes a focused finder workspace backed by a small prospecting API module. Supabase stores searches, normalized businesses, clients, appointments, and invitation deliveries; two Edge Functions isolate Outscraper and Resend credentials. Calendar and provider normalization are pure functions so the integration boundaries can be verified without live secrets.

**Tech Stack:** React 19, TypeScript, Vite, Supabase/Postgres/RLS, Supabase Edge Functions, Outscraper, Resend, Vitest, Testing Library.

---

### Task 1: Lock the domain contracts with failing tests

**Files:**
- Create: `src/features/finder/finderTypes.ts`
- Create: `src/features/finder/finderDomain.test.ts`
- Create: `src/features/finder/finderDomain.ts`

- [ ] **Step 1: Write failing tests** for rejecting incomplete searches, accepting category/location or website searches, normalizing Outscraper records, generating encoded Google Calendar URLs, and generating valid iCalendar text.
- [ ] **Step 2: Run `npx vitest run src/features/finder/finderDomain.test.ts`** and confirm failures are caused by missing exports.
- [ ] **Step 3: Implement typed `validateSearch`, `normalizeOutscraperBusiness`, `buildGoogleCalendarUrl`, and `buildIcsEvent` functions** with no network dependencies.
- [ ] **Step 4: Re-run the focused test** and require all cases to pass.

### Task 2: Add the Supabase schema and server integrations

**Files:**
- Create: `supabase/migrations/202606190002_business_finder_onboarding.sql`
- Create: `supabase/functions/business-search/index.ts`
- Create: `supabase/functions/send-appointment-invite/index.ts`
- Create: `docs/SUPABASE_SETUP.md`
- Modify: `.env.example`

- [ ] **Step 1: Add the additive migration** for profile scheduling settings, search runs, businesses, search results, reviews, client-to-business linkage, appointments, invitations, indexes, constraints, RLS, and grants.
- [ ] **Step 2: Add `business-search`** with authenticated request validation, Outscraper request construction, flexible response normalization, database upserts, and actionable provider errors.
- [ ] **Step 3: Add `send-appointment-invite`** with authenticated appointment lookup, Resend delivery, `.ics` attachment, Google Calendar URL, and invitation audit rows.
- [ ] **Step 4: Document exact Supabase SQL Editor, secret, and function deployment commands** without exposing real credentials.

### Task 3: Add a testable prospecting repository

**Files:**
- Create: `src/features/finder/finderRepository.ts`
- Create: `src/features/finder/finderRepository.test.ts`

- [ ] **Step 1: Write failing repository tests** for invoking business search, saving onboarding records in dependency order, loading upcoming appointments, updating profile Meet settings, and sending an invitation.
- [ ] **Step 2: Run the focused tests** and confirm the missing repository fails them.
- [ ] **Step 3: Implement dependency-injected Supabase calls** so tests use a small fake client while production uses the configured Supabase client.
- [ ] **Step 4: Re-run the tests** and require all repository behavior to pass.

### Task 4: Build the focused finder interface test-first

**Files:**
- Create: `src/features/finder/BusinessFinderPage.tsx`
- Create: `src/features/finder/BusinessFinderPage.test.tsx`
- Create: `src/features/finder/BusinessSearchForm.tsx`
- Create: `src/features/finder/BusinessResults.tsx`
- Create: `src/features/finder/OnboardingPanel.tsx`
- Create: `src/features/finder/AppointmentAgenda.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Write failing component tests** proving the first page has no demo copy or fake businesses, searches through the repository, selects a real result, validates onboarding, schedules a client, and exposes invite/calendar actions.
- [ ] **Step 2: Run the focused component tests** and confirm they fail because the finder page does not exist.
- [ ] **Step 3: Implement the search-first page and focused components** using the approved single-page layout and existing design tokens.
- [ ] **Step 4: Route `/` to Business Finder and remove dashboard/navigation exposure** while preserving the login route.
- [ ] **Step 5: Re-run focused and full tests** and fix only behavior covered by failing tests.

### Task 5: Remove demo-first behavior and document configuration

**Files:**
- Modify: `src/app/WorkspaceProvider.tsx`
- Modify: `src/features/settings/SettingsPage.tsx`
- Modify: `README.md`

- [ ] **Step 1: Remove seeded demo fallback from the root experience** and make missing Supabase configuration an explicit setup state.
- [ ] **Step 2: Simplify settings to reusable Meet URL and timezone controls** used by appointment creation.
- [ ] **Step 3: Update README** with the new product flow, environment variables, schema order, and deployment steps.

### Task 6: Verify, commit, and publish

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run `npm run lint`, `npx vitest run`, `npm run typecheck`, and `npm run build`** and require zero failures.
- [ ] **Step 2: Run the app and verify desktop and mobile finder layouts in the in-app browser.** Exercise search error handling and the onboarding form without transmitting real third-party data.
- [ ] **Step 3: Compare the browser result against the approved text design** for copy, hierarchy, palette, spacing, and responsive behavior; fix visible drift.
- [ ] **Step 4: Commit the complete change and push the current head to GitHub `main`.**
