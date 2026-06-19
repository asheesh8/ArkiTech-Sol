# Business Finder and Client Onboarding Design

## Goal

Replace the demo-heavy dashboard with one focused workspace for finding real local businesses, reviewing their Google Business Profile intelligence, onboarding a selected business, and scheduling an introductory meeting.

## Approved Product Flow

1. The root page opens directly to **Business Finder** with no seeded metrics, fake activity, demo badges, or sample businesses.
2. A salesperson searches by business category and area, or pastes a business website for a targeted lookup.
3. A protected Supabase Edge Function calls Outscraper and returns normalized Google Maps business data.
4. Results show business name, category, address, rating, review count, phone, website, hours, Google Maps link, and recent reviews when supplied by Outscraper.
5. Selecting a result opens an onboarding panel without leaving the page.
6. The salesperson enters the client contact, service, notes, and appointment time.
7. **Onboard & Schedule** persists the business, client, and appointment.
8. **Send Invite** emails the client the appointment, reusable salesperson Meet link, an `.ics` calendar attachment, and an Add to Google Calendar link.
9. **Add to Google Calendar** opens a prefilled Google Calendar event without requiring Google OAuth.
10. A compact agenda shows real upcoming appointments from Supabase.

## Interface

The desktop layout uses a restrained top bar, a large search surface, a results list, and a right-side onboarding panel that appears only after a business is selected. Results remain table-like rather than becoming a dashboard card grid. On mobile, the onboarding panel becomes a full-width step below the selected business. The page uses the existing ArkiTech indigo, white, and slate system with less chrome and no decorative metrics.

Visible primary copy is limited to: ArkiTech, Business Finder, category, area or website, Search businesses, results, onboarding, schedule, Send invite, Add to Google Calendar, and Upcoming appointments.

## Data Model

- `profiles`: adds `email`, `meet_url`, and `timezone`.
- `search_runs`: records each Outscraper request and its status.
- `businesses`: stores normalized Google profile data and the provider payload.
- `search_results`: links a search run to ordered business results.
- `business_reviews`: stores normalized recent reviews.
- `clients`: adds a unique `business_id` relationship for onboarding.
- `appointments`: stores the built-in calendar schedule and reusable Meet link.
- `invitations`: records appointment email delivery attempts.

All new foreign keys receive indexes. RLS uses the existing authenticated workspace membership helper, and Edge Functions keep Outscraper and Resend keys out of the browser.

## Integration Boundaries

### Outscraper

`business-search` accepts a validated category/location search or website lookup. It calls Outscraper's Google Maps Search endpoint with the server-only `OUTSCRAPER_API_KEY`, normalizes inconsistent provider fields, upserts businesses and reviews, records the search result ordering, and returns the persisted business records.

### Scheduling

Appointments are native ArkiTech records. The salesperson's reusable Meet link and timezone are stored on their profile. Google Calendar integration is a URL builder only; no account connection or OAuth is required.

### Email

`send-appointment-invite` validates workspace access, loads the appointment and client, builds HTML and iCalendar content, sends through Resend, and records success or failure in `invitations`.

## Failure States

- Missing search fields: inline validation before making a request.
- Missing Outscraper configuration: explicit setup message, never fake results.
- No businesses found: quiet empty state with suggestions to widen the area or category.
- Provider error: retry action that preserves the search inputs.
- Missing Meet link or client email: onboarding remains saved, but invite actions explain what must be added.
- Email delivery failure: appointment remains scheduled and the failed invitation is recorded for retry.
- Database unavailable: show an actionable Supabase setup state rather than falling back to demo data.

## Testing

- Unit tests for search validation, Outscraper normalization, Google Calendar URL construction, and iCalendar generation.
- Component tests for empty first load, search result rendering, selection, onboarding, scheduling, and error states.
- SQL review for constraints, foreign-key indexes, RLS, and least-privilege grants.
- Browser verification at desktop and mobile widths, including the primary finder-to-schedule interaction.

## Explicit Non-Goals

- No Google OAuth.
- No automatic creation of Google Meet rooms.
- No fake or seeded prospect data.
- No lead pipeline dashboard on the first page.
- No attempt to scrape Google directly from the browser.
