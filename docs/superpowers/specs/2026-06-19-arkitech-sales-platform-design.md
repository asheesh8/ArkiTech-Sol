# ArkiTech-Sol Sales Platform Design

## Goal

Replace the existing vanilla proof of concept with a production-shaped React PWA for Ashish and Terri. The first milestone must make the full sales loop usable: enter the workspace, manage leads, generate a data-aware pitch, convert a lead, inspect clients, and see the results on a responsive dashboard.

## Scope

This milestone includes:

- Responsive authentication and first-login role selection for Ashish or Terri.
- Dashboard metrics, quick actions, activity, commission visibility, and a compact lead pipeline.
- Searchable and filterable leads, lead creation, lead details, activities, status changes, and conversion.
- Four-step pitch workflow with realistic mock business and competitor data behind a replaceable lookup interface.
- Client list and client detail views with plan, billing, activity, and review-growth information.
- Settings, demo reset, profile context, offline state, installable PWA metadata, and iPhone safe areas.
- Supabase schema, row-level security policies, typed database adapter, and local demo adapter.
- Stripe Checkout and webhook functions for subscriptions, one-time payments, cancellation, and payment history.
- Resend delivery with editable templates, durable email history, and automatic activity entries.

Deferred from this milestone are a paid Google Business data provider, push notifications, background sync conflict resolution, and file uploads. Live billing and email code is included, but requires the user's Stripe, Resend, and Supabase secrets before external transactions can be verified.

## Experience Direction

The interface is dark-first and operational rather than decorative: Linear's density, Raycast's contrast, and an iOS app's touch ergonomics. The supplied palette is used as the foundation, with blue reserved for primary actions, purple for trial/pitch moments, green for wins, and warm colors for follow-up risk.

Desktop uses a 240-pixel sidebar and a restrained content canvas. Mobile uses a five-item bottom navigation bar, compact page headers, horizontally scrollable pipeline summaries, full-width cards, and bottom sheets. Cards use subtle layered surfaces and thin borders; glow is an interaction cue, not a constant effect. Motion is short, directional, and disabled when reduced motion is requested.

The dashboard opens with a strong command-center hierarchy: greeting and workspace state, four metric cards, a prominent follow-up queue, pipeline distribution, recent activity, and fast actions. The pitch tool is the visual centerpiece, presenting business context and competitor gaps as evidence the user can scan while speaking.

## Architecture

The app uses React, TypeScript, Vite, React Router, Tailwind CSS, Framer Motion, Zustand, TanStack Query, Supabase, Recharts, Lucide, and vite-plugin-pwa.

The system is split into four boundaries:

1. `app` owns routing, providers, the responsive shell, error boundaries, and runtime mode.
2. `features` owns complete workflows such as leads, pitch, clients, dashboard, onboarding, and settings.
3. `domain` owns shared entity types, status/plan rules, metric calculations, pitch generation, and repository contracts.
4. `data` provides Supabase, local demo, and business-lookup adapters.

Pages do not call Supabase directly. They call typed hooks backed by a `SalesRepository`. The runtime selects the Supabase repository after a successful configuration and schema health check; otherwise it exposes a clearly labeled demo workspace backed by local storage. Demo mode is intentional and visible, never a silent fallback after a failed write.

## Data and Authentication

The Supabase migration creates profiles, leads, lead activities, clients, deals, and review snapshots. It adds indexes, updated-at triggers, and row-level security. Authenticated workspace members can read and write shared sales data; profile identity is derived from `auth.uid()`.

Magic-link authentication is supported. Supabase public signup is disabled and only the two invited addresses may enter. The optional client allowlist fails closed when populated. Role selection is not editable in normal settings. No service-role credential is used in the browser.

## Billing and Email Boundaries

The browser never handles Stripe or Resend secrets. Supabase Edge Functions create customers and Stripe Checkout Sessions, cancel subscriptions, read payment history, send Resend messages, and process signed Stripe webhooks. The webhook is the source of truth for subscription and payment status. Demo mode mirrors these operations locally so the complete UI can be reviewed without causing external side effects.

Local demo mode uses the same entity shapes and repository interface. It seeds representative leads, clients, activities, snapshots, and a deal, then persists mutations under a versioned storage key. Settings can reset demo data after confirmation.

## Core Workflows

### Workspace entry

The login page offers magic link authentication and a direct demo entry. Production authentication leads to role onboarding when required, then to the dashboard. Route guards preserve the intended destination.

### Leads

The list supports instant search, status filters, and assignee filters. Add Lead opens a responsive dialog/sheet and restores an unfinished form draft. Selecting a card opens the detail route. Lead detail supports status updates, assignment, contact links, review evidence, generated pitch, activities, and conversion. Destructive actions require confirmation.

### Pitch

The pitch flow has four explicit steps: lookup, competitor comparison, generated script, and save as lead. The mock lookup service returns deterministic results from a business name and city so the demo feels coherent. Pitch text cites the selected business and competitor numbers and uses the approved ArkiTech offer copy. Saving routes to the created lead.

### Clients

Converting a lead records the chosen plan, term, value, start date, and ownership, then writes the lead status change and activity as one domain operation. Client views expose recurring value, billing timing, review growth, notes, plan status, and source attribution.

### Dashboard

Dashboard metrics are derived from repository data, not independently stored. MRR sums active clients. Monthly closed deals use the current calendar month. Commission is the sum of monthly `commission_earned`. Activity joins lead names and user identity before presentation.

## Loading, Offline, and Failure Behavior

Async routes use shaped skeletons that preserve page layout. Query failures render an inline explanation and retry control. Mutations use optimistic feedback only when rollback is safe; conversion and destructive operations wait for confirmation from the repository.

The PWA caches the application shell and static assets. An offline banner explains that live Supabase writes are unavailable. Local demo writes remain available offline. The app does not claim queued synchronization in this milestone.

Toast messages confirm successful writes and actionable failures. The top-level error boundary provides a reload action without exposing implementation details.

## Accessibility and Responsive Rules

- Every interactive control is keyboard reachable and has a visible focus state.
- Dialogs trap focus and restore it on close.
- Status is expressed through text and color.
- Touch targets are at least 44 pixels on mobile.
- Motion respects `prefers-reduced-motion`.
- Charts include text summaries and tooltips.
- Mobile navigation and sheets use safe-area insets.
- Phone and email values use semantic `tel:` and `mailto:` links.

## Testing

Domain calculations, pitch generation, filters, repository behavior, and conversion rules receive unit tests. Critical React flows receive Testing Library tests against the local repository. The production build, type checker, linter, and test suite must pass. Browser verification covers desktop and mobile dashboard, lead creation, pitch completion, client conversion, navigation, console errors, and PWA manifest availability.

## Reset and Repository Policy

The previous `app.js`, `styles.css`, service worker, manifest, and static `index.html` are discarded. The legacy Word brief remains untouched as a project artifact. Generated companion files under `.superpowers/` and local credentials under `.env.local` are ignored. The supplied Supabase anonymous credential is treated as browser-safe configuration but is never committed.

## Acceptance Criteria

- The app starts with one documented command and renders a polished desktop and mobile experience.
- A user can enter demo mode without backend setup and complete the entire lead-to-client loop.
- Supabase mode has migration SQL, environment configuration, authentication, profile onboarding, and CRUD adapter code ready for the supplied project.
- Dashboard, Leads, Pitch, Clients, Settings, and detail routes are implemented.
- The app is installable as a PWA and contains valid iOS metadata and icons.
- Loading, empty, offline, error, confirmation, and success states are visible and coherent.
- Tests, type checking, linting, and production build pass without warnings that indicate broken behavior.
