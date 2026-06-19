export interface FinderSearchInput {
  category: string;
  location: string;
  website: string;
  limit?: number;
}

export interface BusinessReview {
  providerReviewId: string;
  authorName: string;
  rating: number;
  text: string;
  reviewedAt: string | null;
  ownerResponse: string | null;
}

export interface BusinessProfile {
  id?: string;
  externalId: string;
  googlePlaceId: string | null;
  name: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  googleMapsUrl: string;
  rating: number | null;
  reviewCount: number;
  hours: Record<string, unknown>;
  recentReviews: BusinessReview[];
  rawProfile: Record<string, unknown>;
}

export interface CalendarEventInput {
  title: string;
  startsAt: string;
  endsAt: string;
  description: string;
  location: string;
}

export interface IcsEventInput extends CalendarEventInput {
  uid: string;
}

export interface FinderClientInput {
  businessId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  service: string;
  notes: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  meetUrl: string;
  timezone: string;
}

export interface ScheduledAppointment {
  id: string;
  clientId: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  meetUrl: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface FinderProfileSettings {
  meetUrl: string;
  timezone: string;
}
