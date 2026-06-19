import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { LocalSalesRepository } from '../data/demo/localRepository';
import { seedWorkspace } from '../data/demo/seed';
import type { ActivityInput, ChargeInput, Client, ConvertLeadInput, EmailInput, Lead, LeadInput, WorkspaceSnapshot } from '../domain/types';

interface WorkspaceContextValue {
  workspace: WorkspaceSnapshot;
  activeProfileId: string;
  mode: 'demo' | 'live';
  createLead(input: LeadInput): Promise<Lead>;
  updateLead(id: string, patch: Partial<LeadInput>): Promise<Lead>;
  addActivity(input: ActivityInput): Promise<void>;
  convertLead(input: ConvertLeadInput): Promise<Client>;
  sendEmail(input: EmailInput): Promise<void>;
  chargeClient(input: ChargeInput): Promise<void>;
  resetDemo(): Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const repository = useRef(new LocalSalesRepository());
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(() => structuredClone(seedWorkspace));

  const refresh = useCallback(async () => {
    setWorkspace(await repository.current.getWorkspace());
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspace,
    activeProfileId: 'profile-ashish',
    mode: 'demo',
    async createLead(input) {
      const lead = await repository.current.createLead(input);
      await refresh();
      return lead;
    },
    async updateLead(id, patch) {
      const lead = await repository.current.updateLead(id, patch);
      await refresh();
      return lead;
    },
    async addActivity(input) {
      await repository.current.addActivity(input);
      await refresh();
    },
    async convertLead(input) {
      const client = await repository.current.convertLead(input);
      await refresh();
      return client;
    },
    async sendEmail(input) {
      await repository.current.sendEmail(input);
      await refresh();
    },
    async chargeClient(input) {
      await repository.current.chargeClient(input);
      await refresh();
    },
    async resetDemo() {
      await repository.current.resetDemo();
      await refresh();
    },
  }), [refresh, workspace]);

  return <WorkspaceContext value={value}>{children}</WorkspaceContext>;
}

export function useWorkspace() {
  const value = use(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}
