import type { BusinessProfile, BusinessReview, CalendarEventInput, FinderSearchInput, IcsEventInput } from './finderTypes';

const readString = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const readNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
};

export function validateSearch(input: FinderSearchInput): { valid: true; website?: string } | { valid: false; message: string } {
  const category = input.category.trim();
  const location = input.location.trim();
  const website = input.website.trim();

  if (website) {
    try {
      const normalized = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
      if (!normalized.hostname.includes('.')) throw new Error('invalid hostname');
      return { valid: true, website: normalized.toString().replace(/\/$/, '') };
    } catch {
      return { valid: false, message: 'Enter a valid business website.' };
    }
  }

  if (!category || !location) {
    return { valid: false, message: 'Enter both a business type and an area, or paste a website.' };
  }

  return { valid: true };
}

function normalizeReview(value: unknown, index: number): BusinessReview | null {
  if (!value || typeof value !== 'object') return null;
  const review = value as Record<string, unknown>;
  const rating = readNumber(review.review_rating ?? review.rating) ?? 0;
  return {
    providerReviewId: readString(review.review_id ?? review.id) || `review-${index}`,
    authorName: readString(review.author_title ?? review.author_name ?? review.author),
    rating,
    text: readString(review.review_text ?? review.text),
    reviewedAt: readString(review.review_datetime_utc ?? review.review_date ?? review.datetime) || null,
    ownerResponse: readString(review.owner_answer ?? review.owner_response) || null,
  };
}

export function normalizeOutscraperBusiness(value: unknown): BusinessProfile {
  if (!value || typeof value !== 'object') throw new Error('Outscraper returned an invalid business record.');
  const raw = value as Record<string, unknown>;
  const reviewsValue = raw.reviews_data ?? raw.reviews_content ?? raw.reviews_list;
  const recentReviews = Array.isArray(reviewsValue)
    ? reviewsValue.map(normalizeReview).filter((review): review is BusinessReview => review !== null)
    : [];
  const externalId = readString(raw.place_id ?? raw.google_id ?? raw.cid ?? raw.query);
  const name = readString(raw.name ?? raw.business_name);

  if (!externalId || !name) throw new Error('Outscraper result is missing a business name or place identifier.');

  const hoursValue = raw.working_hours ?? raw.hours;
  return {
    externalId,
    googlePlaceId: readString(raw.place_id) || null,
    name,
    category: readString(raw.type ?? raw.category ?? raw.subtypes),
    address: readString(raw.full_address ?? raw.address),
    city: readString(raw.city),
    phone: readString(raw.phone ?? raw.phone_number),
    email: readString(raw.email),
    website: readString(raw.site ?? raw.website),
    googleMapsUrl: readString(raw.google_maps_url ?? raw.location_link),
    rating: readNumber(raw.rating),
    reviewCount: Math.max(0, Math.trunc(readNumber(raw.reviews ?? raw.reviews_count) ?? 0)),
    hours: hoursValue && typeof hoursValue === 'object' && !Array.isArray(hoursValue) ? hoursValue as Record<string, unknown> : {},
    recentReviews,
    rawProfile: raw,
  };
}

function compactUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${compactUtc(event.startsAt)}/${compactUtc(event.endsAt)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsEvent(event: IcsEventInput): string {
  const now = compactUtc(new Date().toISOString());
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ArkiTech//Client Onboarding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(event.uid)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${compactUtc(event.startsAt)}`,
    `DTEND:${compactUtc(event.endsAt)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
