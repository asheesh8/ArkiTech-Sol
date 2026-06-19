import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BusinessFinderPage } from './BusinessFinderPage';
import type { BusinessProfile, ScheduledAppointment } from './finderTypes';

const business: BusinessProfile = {
  id: 'business-1', externalId: 'place-1', googlePlaceId: 'place-1', name: 'Harbor Dental', category: 'Dentist',
  address: '10 Thames St, Baltimore, MD', city: 'Baltimore', phone: '410-555-0101', email: '', website: 'https://harbor.example',
  googleMapsUrl: 'https://maps.google.com/?cid=1', rating: 4.7, reviewCount: 212, hours: {},
  recentReviews: [{ providerReviewId: 'review-1', authorName: 'Jamie', rating: 5, text: 'Kind team and easy visit.', reviewedAt: '2026-06-01', ownerResponse: null }], rawProfile: {},
};

const appointment: ScheduledAppointment = {
  id: 'appointment-1', clientId: 'client-1', businessName: 'Harbor Dental', contactName: 'Morgan Lee',
  contactEmail: 'morgan@harbor.example', title: 'ArkiTech onboarding — Harbor Dental',
  startsAt: '2026-06-22T14:00:00.000Z', endsAt: '2026-06-22T14:30:00.000Z', timezone: 'America/New_York',
  meetUrl: 'https://meet.google.com/abc-defg-hij', notes: '', status: 'scheduled',
};

function repository(overrides = {}) {
  return {
    isConfigured: true,
    search: vi.fn().mockResolvedValue([business]),
    getProfileSettings: vi.fn().mockResolvedValue({ meetUrl: appointment.meetUrl, timezone: appointment.timezone }),
    saveProfileSettings: vi.fn().mockResolvedValue(undefined),
    onboardAndSchedule: vi.fn().mockResolvedValue(appointment),
    listUpcoming: vi.fn().mockResolvedValue([]),
    sendInvite: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderPage(data = repository()) {
  return render(<MemoryRouter><BusinessFinderPage repository={data as never} /></MemoryRouter>);
}

describe('BusinessFinderPage', () => {
  it('starts as a clean finder with no demo dashboard content', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Business Finder' })).toBeVisible();
    expect(screen.getByRole('button', { name: /search businesses/i })).toBeVisible();
    expect(screen.queryByText(/demo workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/active clients/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/search an area to build your first list/i)).toBeVisible();
  });

  it('searches, selects a real business, and schedules onboarding', async () => {
    const user = userEvent.setup();
    const data = repository();
    renderPage(data);
    await user.type(screen.getByLabelText(/business type/i), 'dentist');
    await user.type(screen.getByLabelText(/^area/i), 'Baltimore, MD');
    await user.click(screen.getByRole('button', { name: /search businesses/i }));

    expect(await screen.findByText('Harbor Dental')).toBeVisible();
    expect(screen.getByText('212 reviews')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /select harbor dental/i }));
    expect(await screen.findByRole('heading', { name: /onboard harbor dental/i })).toBeVisible();

    await user.type(screen.getByLabelText(/contact name/i), 'Morgan Lee');
    await user.type(screen.getByLabelText(/contact email/i), 'morgan@harbor.example');
    await user.type(screen.getByLabelText(/appointment date/i), '2026-06-22');
    await user.type(screen.getByLabelText(/appointment time/i), '10:00');
    await user.click(screen.getByRole('button', { name: /onboard & schedule/i }));

    expect(data.onboardAndSchedule).toHaveBeenCalled();
    expect(await screen.findByText(/onboarding scheduled/i)).toBeVisible();
    expect(screen.getByRole('link', { name: /add to google calendar/i })).toHaveAttribute('href', expect.stringContaining('calendar.google.com'));
    expect(screen.getByRole('button', { name: /send invite/i })).toBeVisible();
  });

  it('keeps search inputs visible when the provider fails', async () => {
    const user = userEvent.setup();
    renderPage(repository({ search: vi.fn().mockRejectedValue(new Error('Outscraper is not configured.')) }));
    await user.type(screen.getByLabelText(/business website/i), 'harbor.example');
    await user.click(screen.getByRole('button', { name: /search businesses/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Outscraper is not configured.');
    expect(screen.getByLabelText(/business website/i)).toHaveValue('harbor.example');
  });
});
