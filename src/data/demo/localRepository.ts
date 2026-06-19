import type { SalesRepository } from '../../domain/repository';
import type {
  ActivityInput,
  Client,
  ChargeInput,
  ConvertLeadInput,
  Lead,
  LeadActivity,
  LeadInput,
  EmailInput,
  EmailSent,
  Payment,
  WorkspaceSnapshot,
} from '../../domain/types';
import { seedWorkspace } from './seed';

const STORAGE_KEY = 'arkitech-sales-workspace:v2';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function load(): WorkspaceSnapshot {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return clone(seedWorkspace);
  try {
    return JSON.parse(stored) as WorkspaceSnapshot;
  } catch {
    return clone(seedWorkspace);
  }
}

export class LocalSalesRepository implements SalesRepository {
  private snapshot = load();

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
  }

  async getWorkspace(): Promise<WorkspaceSnapshot> {
    return clone(this.snapshot);
  }

  async createLead(input: LeadInput): Promise<Lead> {
    const now = new Date().toISOString();
    const lead: Lead = {
      ...input,
      id: createId('lead'),
      status: input.status ?? 'not_contacted',
      createdAt: now,
      updatedAt: now,
    };
    this.snapshot.leads.unshift(lead);
    this.persist();
    return clone(lead);
  }

  async updateLead(id: string, patch: Partial<LeadInput>): Promise<Lead> {
    const index = this.snapshot.leads.findIndex((lead) => lead.id === id);
    if (index < 0) throw new Error('Lead not found');
    const lead = { ...this.snapshot.leads[index], ...patch, updatedAt: new Date().toISOString() };
    this.snapshot.leads[index] = lead;
    this.persist();
    return clone(lead);
  }

  async addActivity(input: ActivityInput): Promise<LeadActivity> {
    const activity: LeadActivity = { ...input, id: createId('activity'), createdAt: new Date().toISOString() };
    this.snapshot.activities.unshift(activity);
    this.persist();
    return clone(activity);
  }

  async convertLead(input: ConvertLeadInput): Promise<Client> {
    const lead = this.snapshot.leads.find((item) => item.id === input.leadId);
    if (!lead) throw new Error('Lead not found');
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    const client: Client = {
      id: createId('client'),
      leadId: lead.id,
      businessName: lead.businessName,
      ownerName: lead.ownerName,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      businessType: lead.businessType,
      plan: input.plan,
      contractTerm: input.contractTerm,
      monthlyValue: input.monthlyValue,
      subscriptionStatus: input.plan === 'trial' ? 'trialing' : 'not_started',
      trialEndsAt: input.plan === 'trial' ? nextBilling.toISOString().slice(0, 10) : null,
      contractStart: now.toISOString().slice(0, 10),
      nextBilling: nextBilling.toISOString().slice(0, 10),
      status: 'active',
      broughtBy: lead.assignedTo,
      notes: lead.notes,
      createdAt: now.toISOString(),
    };
    this.snapshot.clients.unshift(client);
    await this.updateLead(lead.id, { status: 'closed' });
    await this.addActivity({
      leadId: lead.id,
      clientId: client.id,
      userId: lead.assignedTo,
      type: 'status_change',
      content: `Converted to ${input.plan} client at $${input.monthlyValue}/mo.`,
    });
    this.persist();
    return clone(client);
  }

  async sendEmail(input: EmailInput): Promise<EmailSent> {
    const email: EmailSent = { ...input, id: createId('email'), sentAt: new Date().toISOString() };
    this.snapshot.emailsSent.unshift(email);
    await this.addActivity({
      leadId: input.leadId,
      clientId: input.clientId,
      userId: input.sentBy,
      type: 'email',
      content: `Email sent: ${input.subject}`,
    });
    this.persist();
    return clone(email);
  }

  async chargeClient(input: ChargeInput): Promise<Payment> {
    const payment: Payment = {
      ...input,
      id: createId('payment'),
      stripePaymentIntentId: `pi_demo_${crypto.randomUUID().slice(0, 8)}`,
      status: 'succeeded',
      commissionEarned: Number((input.amount * 0.2).toFixed(2)),
      createdAt: new Date().toISOString(),
    };
    this.snapshot.payments.unshift(payment);
    await this.addActivity({
      clientId: input.clientId,
      userId: input.closedBy,
      type: 'payment',
      content: `Payment succeeded: $${input.amount.toLocaleString()}`,
    });
    this.persist();
    return clone(payment);
  }

  async resetDemo(): Promise<WorkspaceSnapshot> {
    this.snapshot = clone(seedWorkspace);
    this.persist();
    return this.getWorkspace();
  }
}
