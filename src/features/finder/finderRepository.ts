import type { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabase } from '../../data/supabase/client';
import { validateSearch } from './finderDomain';
import type {
  BusinessProfile,
  FinderClientInput,
  FinderProfileSettings,
  FinderSearchInput,
  ScheduledAppointment,
} from './finderTypes';

type DataRow = Record<string, unknown>;

export interface FinderBackend {
  configured: boolean;
  searchBusinesses(input: FinderSearchInput): Promise<BusinessProfile[]>;
  getCurrentUserId(): Promise<string>;
  getProfileSettings(userId: string): Promise<FinderProfileSettings>;
  updateProfileSettings(userId: string, settings: FinderProfileSettings): Promise<void>;
  upsertClient(row: DataRow): Promise<{ id: string }>;
  insertAppointment(row: DataRow): Promise<DataRow & { id: string }>;
  markBusinessOnboarded(businessId: string): Promise<void>;
  listUpcomingAppointments(): Promise<DataRow[]>;
  sendAppointmentInvite(appointmentId: string): Promise<void>;
}

const text = (value: unknown) => typeof value === 'string' ? value : '';
const number = (value: unknown) => typeof value === 'number' ? value : value == null ? null : Number(value);

export function friendlyFunctionError(message: string) {
  return message.includes('Failed to send')
    ? 'Business search is not deployed yet. Apply the Supabase schemas and deploy business-search.'
    : message;
}

function mapBusiness(row: DataRow): BusinessProfile {
  const recent = Array.isArray(row.recent_reviews) ? row.recent_reviews : [];
  return {
    id: text(row.id),
    externalId: text(row.external_id),
    googlePlaceId: text(row.google_place_id) || null,
    name: text(row.name),
    category: text(row.category),
    address: text(row.address),
    city: text(row.city),
    phone: text(row.phone),
    email: text(row.email),
    website: text(row.website),
    googleMapsUrl: text(row.google_maps_url),
    rating: number(row.rating),
    reviewCount: Math.max(0, Math.trunc(number(row.review_count) ?? 0)),
    hours: row.hours && typeof row.hours === 'object' ? row.hours as Record<string, unknown> : {},
    recentReviews: recent.map((review, index) => {
      const item = review as DataRow;
      return {
        providerReviewId: text(item.review_id ?? item.id) || `review-${index}`,
        authorName: text(item.author_title ?? item.author_name ?? item.author),
        rating: number(item.review_rating ?? item.rating) ?? 0,
        text: text(item.review_text ?? item.text),
        reviewedAt: text(item.review_datetime_utc ?? item.review_date) || null,
        ownerResponse: text(item.owner_answer ?? item.owner_response) || null,
      };
    }),
    rawProfile: row.raw_profile && typeof row.raw_profile === 'object' ? row.raw_profile as Record<string, unknown> : {},
  };
}

export class SupabaseFinderBackend implements FinderBackend {
  configured: boolean;

  constructor(private readonly client: SupabaseClient | null, configured = Boolean(client)) {
    this.configured = configured;
  }

  private requireClient() {
    if (!this.client) throw new Error('Connect Supabase before using Business Finder. See docs/SUPABASE_SETUP.md.');
    return this.client;
  }

  async searchBusinesses(input: FinderSearchInput): Promise<BusinessProfile[]> {
    const { data, error } = await this.requireClient().functions.invoke('business-search', { body: input });
    if (error) throw new Error(friendlyFunctionError(error.message));
    if (data?.error) throw new Error(data.error);
    return Array.isArray(data?.businesses) ? data.businesses.map((row: DataRow) => mapBusiness(row)) : [];
  }

  async getCurrentUserId(): Promise<string> {
    const { data, error } = await this.requireClient().auth.getUser();
    if (error || !data.user) throw new Error('Sign in before onboarding a client.');
    return data.user.id;
  }

  async getProfileSettings(userId: string): Promise<FinderProfileSettings> {
    const { data, error } = await this.requireClient().from('profiles').select('meet_url,timezone').eq('id', userId).single();
    if (error) throw new Error(error.message);
    return { meetUrl: data.meet_url ?? '', timezone: data.timezone ?? 'America/New_York' };
  }

  async updateProfileSettings(userId: string, settings: FinderProfileSettings): Promise<void> {
    const { error } = await this.requireClient().from('profiles').update({ meet_url: settings.meetUrl, timezone: settings.timezone }).eq('id', userId);
    if (error) throw new Error(error.message);
  }

  async upsertClient(row: DataRow): Promise<{ id: string }> {
    const { data, error } = await this.requireClient().from('clients').upsert(row, { onConflict: 'business_id' }).select('id').single();
    if (error) throw new Error(error.message);
    return data;
  }

  async insertAppointment(row: DataRow): Promise<DataRow & { id: string }> {
    const { data, error } = await this.requireClient().from('appointments').insert(row).select('*').single();
    if (error) throw new Error(error.message);
    return data;
  }

  async markBusinessOnboarded(businessId: string): Promise<void> {
    const { error } = await this.requireClient().from('businesses').update({ status: 'onboarded' }).eq('id', businessId);
    if (error) throw new Error(error.message);
  }

  async listUpcomingAppointments(): Promise<DataRow[]> {
    const { data, error } = await this.requireClient().from('appointments')
      .select('*, clients!inner(business_name,contact_name,contact_email,email)')
      .gte('ends_at', new Date().toISOString()).neq('status', 'cancelled').order('starts_at');
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async sendAppointmentInvite(appointmentId: string): Promise<void> {
    const { data, error } = await this.requireClient().functions.invoke('send-appointment-invite', { body: { appointmentId } });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
  }
}

export class FinderRepository {
  constructor(private readonly backend: FinderBackend) {}

  get isConfigured() {
    return this.backend.configured;
  }

  async search(input: FinderSearchInput): Promise<BusinessProfile[]> {
    const validation = validateSearch(input);
    if (!validation.valid) throw new Error(validation.message);
    return this.backend.searchBusinesses({ ...input, website: validation.website ?? input.website.trim() });
  }

  async getProfileSettings(): Promise<FinderProfileSettings> {
    return this.backend.getProfileSettings(await this.backend.getCurrentUserId());
  }

  async saveProfileSettings(settings: FinderProfileSettings): Promise<void> {
    const userId = await this.backend.getCurrentUserId();
    await this.backend.updateProfileSettings(userId, settings);
  }

  async onboardAndSchedule(business: BusinessProfile, input: FinderClientInput): Promise<ScheduledAppointment> {
    if (!business.id) throw new Error('Select a saved business before onboarding.');
    const userId = await this.backend.getCurrentUserId();
    const client = await this.backend.upsertClient({
      business_id: business.id,
      business_name: business.name,
      owner_name: input.contactName,
      email: input.contactEmail,
      phone: input.contactPhone,
      address: business.address,
      business_type: business.category,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      service: input.service,
      plan: 'custom',
      contract_term: 'monthly',
      monthly_value: 0,
      brought_by: userId,
      notes: input.notes,
      status: 'active',
    });

    const startsAt = new Date(`${input.appointmentDate}T${input.appointmentTime}:00`).toISOString();
    const endsAt = new Date(new Date(startsAt).getTime() + input.durationMinutes * 60_000).toISOString();
    const title = `ArkiTech onboarding — ${business.name}`;
    const row = await this.backend.insertAppointment({
      client_id: client.id,
      created_by: userId,
      title,
      starts_at: startsAt,
      ends_at: endsAt,
      timezone: input.timezone,
      meet_url: input.meetUrl,
      notes: input.notes,
      status: 'scheduled',
    });
    await this.backend.markBusinessOnboarded(business.id);
    return {
      id: row.id,
      clientId: client.id,
      businessName: business.name,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      title,
      startsAt,
      endsAt,
      timezone: input.timezone,
      meetUrl: input.meetUrl,
      notes: input.notes,
      status: 'scheduled',
    };
  }

  async listUpcoming(): Promise<ScheduledAppointment[]> {
    const rows = await this.backend.listUpcomingAppointments();
    return rows.map((row) => {
      const client = row.clients as DataRow;
      return {
        id: text(row.id), clientId: text(row.client_id), businessName: text(client.business_name),
        contactName: text(client.contact_name), contactEmail: text(client.contact_email ?? client.email),
        title: text(row.title), startsAt: text(row.starts_at), endsAt: text(row.ends_at),
        timezone: text(row.timezone), meetUrl: text(row.meet_url), notes: text(row.notes),
        status: text(row.status) as ScheduledAppointment['status'],
      };
    });
  }

  async sendInvite(appointmentId: string): Promise<void> {
    await this.backend.sendAppointmentInvite(appointmentId);
  }
}

export const finderRepository = new FinderRepository(new SupabaseFinderBackend(supabase, hasSupabaseConfig));
