# ArkiTech-Sol Sales Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the repository as a polished React PWA that supports the complete ArkiTech lead-to-client sales loop in demo mode and is ready for Supabase mode.

**Architecture:** Feature pages consume a typed `SalesRepository`; local demo and Supabase implementations sit behind that contract. Domain functions own metrics, pitch generation, and conversion rules, while the app shell owns routing, responsive navigation, runtime mode, and PWA behavior.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, Zustand, TanStack Query, Supabase, Recharts, Lucide React, Vitest, Testing Library, vite-plugin-pwa.

---

### Task 1: Reset and scaffold the React PWA

**Files:**
- Delete: `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`
- Replace: `index.html`, `README.md`
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.gitignore`, `.env.example`, `src/main.tsx`, `src/test/setup.ts`
- Test: `src/app/smoke.test.tsx`

- [ ] **Step 1: Write the failing smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the ArkiTech workspace entry', () => {
  render(<App />);
  expect(screen.getByText(/close the gaps/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Install dependencies and verify the test fails**

Run: `npm install && npm test -- --run src/app/smoke.test.tsx`

Expected: FAIL because `src/app/App.tsx` does not exist.

- [ ] **Step 3: Add the minimal app entry and build configuration**

```tsx
export function App() {
  return <main>Close the gaps. Show the proof.</main>;
}
```

- [ ] **Step 4: Verify the smoke test passes**

Run: `npm test -- --run src/app/smoke.test.tsx`

Expected: PASS with one test.

- [ ] **Step 5: Commit the scaffold**

```powershell
git add .
git commit -m "Reset ArkiTech as a React PWA"
```

### Task 2: Define the domain and resilient repositories

**Files:**
- Create: `src/domain/types.ts`, `src/domain/repository.ts`, `src/domain/metrics.ts`, `src/domain/pitch.ts`, `src/domain/filters.ts`
- Create: `src/data/demo/seed.ts`, `src/data/demo/localRepository.ts`, `src/data/runtime.ts`
- Test: `src/domain/metrics.test.ts`, `src/domain/pitch.test.ts`, `src/data/demo/localRepository.test.ts`

- [ ] **Step 1: Write failing tests for metrics, pitches, and persistence**

```ts
it('derives active MRR and monthly commission', () => {
  expect(calculateMetrics(seedWorkspace, new Date('2026-06-19'))).toMatchObject({
    activeMrr: 891,
    commissionThisMonth: 208.2,
  });
});

it('uses the competitor gap in the generated hook', () => {
  expect(generatePitch(business, competitor).hook).toContain('147 more reviews');
});
```

- [ ] **Step 2: Run the tests and confirm missing-domain failures**

Run: `npm test -- --run src/domain src/data/demo`

Expected: FAIL because the imported domain functions and repository do not exist.

- [ ] **Step 3: Implement focused entity types and repository methods**

```ts
export interface SalesRepository {
  getWorkspace(): Promise<WorkspaceSnapshot>;
  createLead(input: LeadInput): Promise<Lead>;
  updateLead(id: string, patch: Partial<LeadInput>): Promise<Lead>;
  addActivity(input: ActivityInput): Promise<LeadActivity>;
  convertLead(input: ConvertLeadInput): Promise<Client>;
  resetDemo(): Promise<WorkspaceSnapshot>;
}
```

- [ ] **Step 4: Implement deterministic seed data and versioned local persistence**

```ts
const STORAGE_KEY = 'arkitech-sales-workspace:v1';

function persist(snapshot: WorkspaceSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}
```

- [ ] **Step 5: Run the domain and repository tests**

Run: `npm test -- --run src/domain src/data/demo`

Expected: PASS with no storage leakage between tests.

- [ ] **Step 6: Commit the domain slice**

```powershell
git add src/domain src/data
git commit -m "Add sales domain and demo repository"
```

### Task 3: Build the app shell and design system

**Files:**
- Create: `src/app/App.tsx`, `src/app/providers.tsx`, `src/app/router.tsx`, `src/app/AppShell.tsx`, `src/app/ErrorBoundary.tsx`
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/Skeleton.tsx`, `src/components/ui/EmptyState.tsx`
- Create: `src/styles/globals.css`, `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`
- Test: `src/app/AppShell.test.tsx`, `src/components/ui/Button.test.tsx`

- [ ] **Step 1: Write failing navigation and button tests**

```tsx
it('shows five primary destinations', () => {
  renderShell('/');
  for (const label of ['Command', 'Leads', 'Pitch', 'Clients', 'Settings']) {
    expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeVisible();
  }
});
```

- [ ] **Step 2: Verify the shell tests fail**

Run: `npm test -- --run src/app/AppShell.test.tsx src/components/ui/Button.test.tsx`

Expected: FAIL because the shell and UI primitives are missing.

- [ ] **Step 3: Implement the token system, responsive navigation, and primitives**

```css
:root {
  --bg: #0a0a0f;
  --surface: #111118;
  --card: #16161f;
  --line: #242438;
  --blue: #4f8ef7;
  --purple: #7c5cfc;
  --text: #f0f0ff;
  --muted: #8888aa;
}
```

- [ ] **Step 4: Configure the manifest, service worker, and iOS metadata**

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: { name: 'ArkiTech-Sol', short_name: 'ArkiTech', display: 'standalone' },
});
```

- [ ] **Step 5: Run shell tests and the production build**

Run: `npm test -- --run src/app src/components/ui && npm run build`

Expected: PASS and a generated PWA manifest in `dist`.

- [ ] **Step 6: Commit the shell slice**

```powershell
git add src/app src/components src/styles public vite.config.ts index.html
git commit -m "Build responsive ArkiTech app shell"
```

### Task 4: Implement dashboard and lead workflows

**Files:**
- Create: `src/features/dashboard/DashboardPage.tsx`, `src/features/dashboard/StatCard.tsx`, `src/features/dashboard/Pipeline.tsx`, `src/features/dashboard/ActivityFeed.tsx`
- Create: `src/features/leads/LeadsPage.tsx`, `src/features/leads/LeadDetailPage.tsx`, `src/features/leads/LeadCard.tsx`, `src/features/leads/LeadForm.tsx`, `src/features/leads/ActivityComposer.tsx`
- Create: `src/hooks/useWorkspace.ts`, `src/state/uiStore.ts`
- Test: `src/features/dashboard/DashboardPage.test.tsx`, `src/features/leads/LeadsPage.test.tsx`, `src/features/leads/LeadDetailPage.test.tsx`

- [ ] **Step 1: Write failing lead filtering and creation tests**

```tsx
it('creates a lead and exposes it in instant search', async () => {
  renderApp('/leads');
  await user.click(screen.getByRole('button', { name: /add lead/i }));
  await user.type(screen.getByLabelText(/business name/i), 'Northstar Dental');
  await user.click(screen.getByRole('button', { name: /save lead/i }));
  expect(await screen.findByText('Northstar Dental')).toBeVisible();
});
```

- [ ] **Step 2: Verify the workflow tests fail**

Run: `npm test -- --run src/features/dashboard src/features/leads`

Expected: FAIL because feature pages are not implemented.

- [ ] **Step 3: Implement dashboard composition and lead routes**

```tsx
<Routes>
  <Route index element={<DashboardPage />} />
  <Route path="leads" element={<LeadsPage />} />
  <Route path="leads/:leadId" element={<LeadDetailPage />} />
</Routes>
```

- [ ] **Step 4: Implement responsive lead form, activity creation, status updates, and confirmations**

```ts
await repository.addActivity({
  leadId,
  userId: activeProfile.id,
  type: activityType,
  content: activityText.trim(),
});
```

- [ ] **Step 5: Run feature tests**

Run: `npm test -- --run src/features/dashboard src/features/leads`

Expected: PASS for dashboard metrics, filtering, creation, activities, and status changes.

- [ ] **Step 6: Commit the workflow slice**

```powershell
git add src/features/dashboard src/features/leads src/hooks src/state src/app/router.tsx
git commit -m "Add dashboard and lead workflows"
```

### Task 5: Implement the pitch weapon and client conversion

**Files:**
- Create: `src/data/lookup/mockBusinessLookup.ts`
- Create: `src/features/pitch/PitchPage.tsx`, `src/features/pitch/BusinessLookup.tsx`, `src/features/pitch/CompetitorComparison.tsx`, `src/features/pitch/PitchScript.tsx`
- Create: `src/features/clients/ClientsPage.tsx`, `src/features/clients/ClientDetailPage.tsx`, `src/features/clients/ClientCard.tsx`, `src/features/clients/ReviewGrowthChart.tsx`
- Test: `src/features/pitch/PitchPage.test.tsx`, `src/features/clients/ClientsPage.test.tsx`, `src/domain/conversion.test.ts`

- [ ] **Step 1: Write failing pitch and conversion tests**

```tsx
it('completes lookup, comparison, script, and save as lead', async () => {
  renderApp('/pitch');
  await user.type(screen.getByLabelText(/business name/i), 'Harbor Dental');
  await user.type(screen.getByLabelText(/city/i), 'Baltimore');
  await user.click(screen.getByRole('button', { name: /build snapshot/i }));
  expect(await screen.findByText(/competitor gap/i)).toBeVisible();
});
```

- [ ] **Step 2: Verify the tests fail for missing pitch and client features**

Run: `npm test -- --run src/features/pitch src/features/clients src/domain/conversion.test.ts`

Expected: FAIL because the pitch and conversion components do not exist.

- [ ] **Step 3: Implement deterministic lookup and pitch progression**

```ts
export async function lookupBusiness(query: LookupQuery): Promise<LookupResult> {
  const seed = stableHash(`${query.name}:${query.city}`);
  return buildLookupFixture(query, seed);
}
```

- [ ] **Step 4: Implement conversion and client views**

```ts
await repository.convertLead({
  leadId,
  plan: 'reviewtainer',
  contractTerm: 'monthly',
  monthlyValue: 197,
  commissionPct: 20,
});
```

- [ ] **Step 5: Run pitch and client tests**

Run: `npm test -- --run src/features/pitch src/features/clients src/domain/conversion.test.ts`

Expected: PASS for the four pitch steps, saving, conversion, and client rendering.

- [ ] **Step 6: Commit the revenue slice**

```powershell
git add src/data/lookup src/features/pitch src/features/clients src/domain
git commit -m "Add pitch and client revenue workflows"
```

### Task 6: Add Supabase readiness, onboarding, and settings

**Files:**
- Create: `supabase/migrations/202606190001_sales_workspace.sql`
- Create: `src/data/supabase/client.ts`, `src/data/supabase/supabaseRepository.ts`, `src/features/auth/LoginPage.tsx`, `src/features/auth/RoleOnboarding.tsx`, `src/features/settings/SettingsPage.tsx`
- Create: `.env.local`
- Test: `src/features/auth/RoleOnboarding.test.tsx`, `src/data/runtime.test.ts`

- [ ] **Step 1: Write failing runtime and onboarding tests**

```ts
it('selects demo mode when the schema health check fails', async () => {
  expect(await chooseRuntime(failingSupabaseClient)).toEqual({ mode: 'demo' });
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- --run src/features/auth src/data/runtime.test.ts`

Expected: FAIL because authentication and runtime selection are missing.

- [ ] **Step 3: Add migration SQL with RLS and indexes**

```sql
alter table public.leads enable row level security;
create policy "workspace members manage leads" on public.leads
for all to authenticated using (true) with check (true);
create index leads_status_idx on public.leads(status);
```

- [ ] **Step 4: Implement magic link, role onboarding, schema health check, and Supabase repository**

```ts
await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: window.location.origin },
});
```

- [ ] **Step 5: Add settings, runtime disclosure, reset confirmation, and sign out**

```tsx
<Badge tone={mode === 'demo' ? 'warning' : 'success'}>
  {mode === 'demo' ? 'Demo workspace' : 'Supabase live'}
</Badge>
```

- [ ] **Step 6: Run auth/runtime tests and type checking**

Run: `npm test -- --run src/features/auth src/data/runtime.test.ts && npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit the backend-ready slice**

```powershell
git add supabase src/data/supabase src/features/auth src/features/settings .env.example .gitignore
git commit -m "Add Supabase onboarding and workspace settings"
```

### Task 7: Verify the complete product story

**Files:**
- Modify: `README.md`
- Test: all test files and the browser runtime

- [ ] **Step 1: Run the automated verification suite**

Run: `npm run lint && npm run typecheck && npm test -- --run && npm run build`

Expected: all commands exit zero and the PWA plugin emits its service worker.

- [ ] **Step 2: Start the local demo**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL and the dashboard loads in demo mode.

- [ ] **Step 3: Verify desktop and mobile flows in the browser**

Check dashboard, lead creation, lead detail activity, pitch progression, save as lead, conversion, client detail, settings reset confirmation, offline banner, route refresh, and absence of console errors.

- [ ] **Step 4: Verify PWA resources**

Open `/manifest.webmanifest` and verify the 192- and 512-pixel icons return HTTP 200.

- [ ] **Step 5: Commit final documentation and fixes**

```powershell
git add .
git commit -m "Complete ArkiTech sales platform rebuild"
```
