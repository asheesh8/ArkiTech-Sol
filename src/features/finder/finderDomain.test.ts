import { describe, expect, it } from 'vitest';
import {
  buildGoogleCalendarUrl,
  buildIcsEvent,
  normalizeOutscraperBusiness,
  validateSearch,
} from './finderDomain';

describe('validateSearch', () => {
  it('requires category and location when no website is supplied', () => {
    expect(validateSearch({ category: 'dentist', location: '', website: '' })).toEqual({
      valid: false,
      message: 'Enter both a business type and an area, or paste a website.',
    });
  });

  it('accepts a category and location search', () => {
    expect(validateSearch({ category: 'dentist', location: 'Baltimore, MD', website: '' })).toEqual({ valid: true });
  });

  it('accepts and normalizes a website-only search', () => {
    expect(validateSearch({ category: '', location: '', website: 'arkitech.solutions' })).toEqual({
      valid: true,
      website: 'https://arkitech.solutions',
    });
  });
});

describe('normalizeOutscraperBusiness', () => {
  it('maps provider fields and recent reviews into the app contract', () => {
    const business = normalizeOutscraperBusiness({
      place_id: 'ChIJ-123',
      name: 'Harbor Dental',
      type: 'Dentist',
      full_address: '10 Thames St, Baltimore, MD 21231',
      city: 'Baltimore',
      phone: '+1 410-555-0101',
      site: 'https://harbordental.example',
      rating: 4.7,
      reviews: 212,
      google_maps_url: 'https://maps.google.com/?cid=123',
      working_hours: { Monday: '8 AM–5 PM' },
      reviews_data: [{ review_id: 'r1', author_title: 'Jamie', review_rating: 5, review_text: 'Kind team.', review_datetime_utc: '2026-06-01T12:00:00Z' }],
    });

    expect(business).toMatchObject({
      externalId: 'ChIJ-123',
      name: 'Harbor Dental',
      category: 'Dentist',
      reviewCount: 212,
      rating: 4.7,
      website: 'https://harbordental.example',
    });
    expect(business.recentReviews[0]).toMatchObject({ providerReviewId: 'r1', authorName: 'Jamie', rating: 5, text: 'Kind team.' });
  });
});

describe('calendar helpers', () => {
  const appointment = {
    title: 'ArkiTech onboarding — Harbor Dental',
    startsAt: '2026-06-22T14:00:00.000Z',
    endsAt: '2026-06-22T14:30:00.000Z',
    description: 'Review growth onboarding',
    location: 'https://meet.google.com/abc-defg-hij',
  };

  it('creates a prefilled Google Calendar URL', () => {
    const url = new URL(buildGoogleCalendarUrl(appointment));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(appointment.title);
    expect(url.searchParams.get('location')).toBe(appointment.location);
    expect(url.searchParams.get('dates')).toBe('20260622T140000Z/20260622T143000Z');
  });

  it('creates a valid iCalendar event containing the Meet link', () => {
    const ics = buildIcsEvent({ ...appointment, uid: 'appointment-1@arkitech.solutions' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:appointment-1@arkitech.solutions');
    expect(ics).toContain('DTSTART:20260622T140000Z');
    expect(ics).toContain('LOCATION:https://meet.google.com/abc-defg-hij');
    expect(ics).toContain('END:VCALENDAR');
  });
});
