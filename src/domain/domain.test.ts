import { calculateDashboardMetrics } from './metrics';
import { buildPitchScript } from './pitch';
import { filterLeads } from './filters';
import type { BusinessSnapshot, Lead, WorkspaceSnapshot } from './types';

const leads: Lead[] = [
  {
    id: 'lead-1',
    businessName: 'Harbor Dental',
    ownerName: 'Maya Ruiz',
    phone: '410-555-0147',
    email: 'maya@harbordental.example',
    address: '1440 Light Street',
    city: 'Baltimore',
    businessType: 'Dentist',
    rating: 4.3,
    reviewCount: 22,
    lastReviewDate: '2026-05-04',
    notes: 'Owner answers before noon.',
    status: 'follow_up',
    assignedTo: 'profile-ashish',
    createdBy: 'profile-terri',
    createdAt: '2026-06-10T14:00:00.000Z',
    updatedAt: '2026-06-18T16:00:00.000Z',
  },
  {
    id: 'lead-2',
    businessName: 'Northstar Auto',
    ownerName: 'Derrick Bell',
    phone: '410-555-0199',
    email: 'derrick@northstar.example',
    address: '8800 York Road',
    city: 'Towson',
    businessType: 'Auto repair',
    rating: 4.8,
    reviewCount: 118,
    lastReviewDate: '2026-06-16',
    notes: '',
    status: 'pitched',
    assignedTo: 'profile-terri',
    createdBy: 'profile-terri',
    createdAt: '2026-06-08T14:00:00.000Z',
    updatedAt: '2026-06-17T16:00:00.000Z',
  },
];

const workspace: WorkspaceSnapshot = {
  profiles: [
    { id: 'profile-ashish', name: 'Ashish', role: 'ashish', initials: 'AS' },
    { id: 'profile-terri', name: 'Terri', role: 'terri', initials: 'TE' },
  ],
  leads,
  activities: [],
  clients: [
    {
      id: 'client-1',
      leadId: 'lead-3',
      businessName: 'BrightPath Electric',
      ownerName: 'Chris Morgan',
      phone: '410-555-0102',
      email: 'chris@brightpath.example',
      plan: 'reviewtainer',
      contractTerm: 'monthly',
      monthlyValue: 197,
      startDate: '2026-05-01',
      nextBilling: '2026-07-01',
      status: 'active',
      broughtBy: 'profile-terri',
      notes: '',
      createdAt: '2026-05-01T12:00:00.000Z',
    },
    {
      id: 'client-2',
      leadId: 'lead-4',
      businessName: 'HomeSHINE Services',
      ownerName: 'Alicia Stone',
      phone: '410-555-0130',
      email: 'alicia@homeshine.example',
      plan: 'ultraretainer',
      contractTerm: '6month',
      monthlyValue: 347,
      startDate: '2026-06-01',
      nextBilling: '2026-07-01',
      status: 'active',
      broughtBy: 'profile-ashish',
      notes: '',
      createdAt: '2026-06-01T12:00:00.000Z',
    },
  ],
  emailsSent: [],
  payments: [
    {
      id: 'payment-1',
      clientId: 'client-2',
      stripePaymentIntentId: 'pi_demo_1',
      amount: 1041,
      status: 'succeeded',
      type: 'one_time',
      closedBy: 'profile-ashish',
      commissionEarned: 208.2,
      createdAt: '2026-06-07T12:00:00.000Z',
    },
  ],
  reviewSnapshots: [],
};

it('derives active MRR and monthly commission', () => {
  expect(calculateDashboardMetrics(workspace, new Date('2026-06-19T12:00:00.000Z'))).toMatchObject({
    totalLeads: 2,
    activeClients: 2,
    activeMrr: 544,
    dealsThisMonth: 1,
    commissionThisMonth: 208.2,
  });
});

it('uses the competitor gap in the generated pitch', () => {
  const business: BusinessSnapshot = {
    name: 'Harbor Dental',
    city: 'Baltimore',
    category: 'Dentist',
    address: '1440 Light Street',
    rating: 4.3,
    reviewCount: 22,
    lastReviewDaysAgo: 46,
    responseRate: 12,
  };
  const competitor = { ...business, name: 'Canton Smile Co.', reviewCount: 169, rating: 4.8 };

  expect(buildPitchScript(business, competitor).hook).toContain('147 more reviews');
});

it('filters leads by search, status, and assignee', () => {
  expect(filterLeads(leads, { search: 'harbor', status: 'follow_up', assignee: 'profile-ashish' })).toEqual([
    leads[0],
  ]);
});
