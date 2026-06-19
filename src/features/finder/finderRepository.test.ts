import { describe, expect, it, vi } from 'vitest';
import { FinderRepository, friendlyFunctionError, type FinderBackend } from './finderRepository';
import type { BusinessProfile } from './finderTypes';

const business: BusinessProfile = {
  id: 'business-1', externalId: 'place-1', googlePlaceId: 'place-1', name: 'Harbor Dental', category: 'Dentist',
  address: '10 Thames St', city: 'Baltimore', phone: '410-555-0101', email: '', website: 'https://harbor.example',
  googleMapsUrl: 'https://maps.google.com/?cid=1', rating: 4.7, reviewCount: 212, hours: {}, recentReviews: [], rawProfile: {},
};

function backend(): FinderBackend {
  return {
    configured: true,
    searchBusinesses: vi.fn().mockResolvedValue([business]),
    getCurrentUserId: vi.fn().mockResolvedValue('user-1'),
    getProfileSettings: vi.fn().mockResolvedValue({ meetUrl: 'https://meet.google.com/abc-defg-hij', timezone: 'America/New_York' }),
    updateProfileSettings: vi.fn().mockResolvedValue(undefined),
    upsertClient: vi.fn().mockResolvedValue({ id: 'client-1' }),
    insertAppointment: vi.fn().mockImplementation(async (row) => ({ id: 'appointment-1', ...row })),
    markBusinessOnboarded: vi.fn().mockResolvedValue(undefined),
    listUpcomingAppointments: vi.fn().mockResolvedValue([]),
    sendAppointmentInvite: vi.fn().mockResolvedValue(undefined),
  };
}

describe('FinderRepository', () => {
  it('turns an unavailable Edge Function error into setup guidance', () => {
    expect(friendlyFunctionError('Failed to send a request to the Edge Function')).toBe(
      'Business search is not deployed yet. Apply the Supabase schemas and deploy business-search.',
    );
  });

  it('normalizes website searches before invoking the provider', async () => {
    const data = backend();
    const repository = new FinderRepository(data);
    await repository.search({ category: '', location: '', website: 'harbor.example', limit: 20 });
    expect(data.searchBusinesses).toHaveBeenCalledWith({ category: '', location: '', website: 'https://harbor.example', limit: 20 });
  });

  it('persists the client before its appointment and marks the business onboarded', async () => {
    const data = backend();
    const repository = new FinderRepository(data);
    const appointment = await repository.onboardAndSchedule(business, {
      businessId: 'business-1', contactName: 'Morgan Lee', contactEmail: 'morgan@harbor.example', contactPhone: '410-555-0199',
      service: 'Review growth', notes: 'Start with front desk training.', appointmentDate: '2026-06-22', appointmentTime: '10:00',
      durationMinutes: 30, meetUrl: 'https://meet.google.com/abc-defg-hij', timezone: 'America/New_York',
    });

    expect(data.upsertClient).toHaveBeenCalledWith(expect.objectContaining({ business_id: 'business-1', business_name: 'Harbor Dental', contact_name: 'Morgan Lee' }));
    expect(data.insertAppointment).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-1', created_by: 'user-1', title: 'ArkiTech onboarding — Harbor Dental' }));
    expect(data.markBusinessOnboarded).toHaveBeenCalledWith('business-1');
    expect(appointment).toMatchObject({ id: 'appointment-1', clientId: 'client-1', businessName: 'Harbor Dental', contactEmail: 'morgan@harbor.example' });
  });

  it('updates profile scheduling settings and delegates invitation delivery', async () => {
    const data = backend();
    const repository = new FinderRepository(data);
    await repository.saveProfileSettings({ meetUrl: 'https://meet.google.com/new-room', timezone: 'America/Chicago' });
    await repository.sendInvite('appointment-1');
    expect(data.updateProfileSettings).toHaveBeenCalledWith('user-1', { meetUrl: 'https://meet.google.com/new-room', timezone: 'America/Chicago' });
    expect(data.sendAppointmentInvite).toHaveBeenCalledWith('appointment-1');
  });
});
