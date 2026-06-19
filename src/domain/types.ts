export type Role = 'ashish' | 'terri';
export type LeadStatus = 'not_contacted' | 'pitched' | 'follow_up' | 'trial' | 'closed' | 'lost';
export type Plan = 'trial' | 'reviewtainer' | 'ultraretainer' | 'custom';
export type ContractTerm = 'monthly' | '6month' | '12month' | 'ip_buyout';
export type ClientStatus = 'active' | 'paused' | 'churned';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'not_started';
export type ActivityType = 'call' | 'visit' | 'email' | 'note' | 'status_change' | 'payment';
export type EmailType = 'follow_up' | 'proposal' | 'check_in' | 'invoice' | 'free_trial' | 'custom';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending';
export type PaymentType = 'subscription' | 'one_time';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  initials: string;
}

export interface CompetitorSnapshot {
  name: string;
  rating: number;
  reviewCount: number;
  distanceMiles?: number;
}

export interface Lead {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  businessType: string;
  rating: number | null;
  reviewCount: number | null;
  lastReviewDate: string | null;
  competitorData?: CompetitorSnapshot[];
  notes: string;
  status: LeadStatus;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadInput = Omit<Lead, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
  status?: LeadStatus;
};

export interface Client {
  id: string;
  leadId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  businessType?: string;
  plan: Plan;
  contractTerm: ContractTerm;
  monthlyValue: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: string | null;
  contractStart?: string;
  contractEnd?: string | null;
  startDate?: string;
  nextBilling: string;
  status: ClientStatus;
  broughtBy: string;
  notes: string;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  leadId?: string;
  clientId?: string;
  userId: string;
  type: ActivityType;
  content: string;
  createdAt: string;
}

export interface EmailSent {
  id: string;
  leadId?: string;
  clientId?: string;
  sentBy: string;
  toEmail: string;
  subject: string;
  body: string;
  type: EmailType;
  sentAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  stripePaymentIntentId?: string;
  amount: number;
  status: PaymentStatus;
  type: PaymentType;
  closedBy: string;
  commissionEarned?: number;
  createdAt: string;
}

export interface ReviewSnapshot {
  id: string;
  clientId?: string;
  leadId?: string;
  rating: number;
  reviewCount: number;
  pulledAt: string;
}

export interface WorkspaceSnapshot {
  profiles: Profile[];
  leads: Lead[];
  clients: Client[];
  activities: LeadActivity[];
  emailsSent: EmailSent[];
  payments: Payment[];
  reviewSnapshots: ReviewSnapshot[];
}

export interface BusinessSnapshot {
  name: string;
  city: string;
  category: string;
  address: string;
  rating: number;
  reviewCount: number;
  lastReviewDaysAgo: number;
  responseRate: number;
  businessHours?: string;
}

export interface ConvertLeadInput {
  leadId: string;
  plan: Plan;
  contractTerm: ContractTerm;
  monthlyValue: number;
  commissionPct: number;
}

export interface ActivityInput {
  leadId?: string;
  clientId?: string;
  userId: string;
  type: ActivityType;
  content: string;
}

export type EmailInput = Omit<EmailSent, 'id' | 'sentAt'>;

export interface ChargeInput {
  clientId: string;
  amount: number;
  type: PaymentType;
  closedBy: string;
}
