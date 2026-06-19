import { LocalSalesRepository } from './localRepository';

beforeEach(() => {
  localStorage.clear();
});

it('creates a lead and converts it into a client', async () => {
  const repository = new LocalSalesRepository();
  const lead = await repository.createLead({
    businessName: 'Northstar Dental',
    ownerName: 'Jules Carter',
    phone: '410-555-0188',
    email: 'jules@northstar.example',
    address: '700 Pratt Street',
    city: 'Baltimore',
    businessType: 'Dentist',
    rating: 4.2,
    reviewCount: 31,
    lastReviewDate: '2026-06-01',
    notes: '',
    assignedTo: 'profile-terri',
    createdBy: 'profile-terri',
  });

  const client = await repository.convertLead({
    leadId: lead.id,
    plan: 'reviewtainer',
    contractTerm: 'monthly',
    monthlyValue: 197,
    commissionPct: 20,
  });
  const next = await repository.getWorkspace();

  expect(client.businessName).toBe('Northstar Dental');
  expect(next.leads.find((item) => item.id === lead.id)?.status).toBe('closed');
  expect(next.activities.some((activity) => activity.leadId === lead.id && activity.type === 'status_change')).toBe(true);
});

it('logs sent email and demo charges in the shared activity timeline', async () => {
  const repository = new LocalSalesRepository();
  const client = (await repository.getWorkspace()).clients[0];

  await repository.sendEmail({
    clientId: client.id,
    sentBy: 'profile-ashish',
    toEmail: client.email,
    subject: 'Quick check in',
    body: 'How are things going?',
    type: 'check_in',
  });
  await repository.chargeClient({
    clientId: client.id,
    amount: 197,
    type: 'one_time',
    closedBy: 'profile-ashish',
  });

  const next = await repository.getWorkspace();
  expect(next.emailsSent[0]).toMatchObject({ clientId: client.id, subject: 'Quick check in' });
  expect(next.payments[0]).toMatchObject({ clientId: client.id, amount: 197, status: 'succeeded' });
  expect(next.activities.filter((activity) => activity.clientId === client.id)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'email' }),
      expect.objectContaining({ type: 'payment' }),
    ]),
  );
});
