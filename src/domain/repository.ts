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
} from './types';

export interface SalesRepository {
  getWorkspace(): Promise<WorkspaceSnapshot>;
  createLead(input: LeadInput): Promise<Lead>;
  updateLead(id: string, patch: Partial<LeadInput>): Promise<Lead>;
  addActivity(input: ActivityInput): Promise<LeadActivity>;
  convertLead(input: ConvertLeadInput): Promise<Client>;
  sendEmail(input: EmailInput): Promise<EmailSent>;
  chargeClient(input: ChargeInput): Promise<Payment>;
  resetDemo(): Promise<WorkspaceSnapshot>;
}
