import { isSameMonth } from 'date-fns';
import type { WorkspaceSnapshot } from './types';

export interface DashboardMetrics {
  totalLeads: number;
  pipelineLeads: number;
  activeClients: number;
  activeMrr: number;
  dealsThisMonth: number;
  commissionThisMonth: number;
}

export function calculateDashboardMetrics(workspace: WorkspaceSnapshot, now = new Date()): DashboardMetrics {
  const activeClients = workspace.clients.filter((client) => client.status === 'active');
  const dealsThisMonth = workspace.clients.filter((client) => isSameMonth(new Date(client.createdAt), now)).length;
  const commissionThisMonth = workspace.payments.reduce((total, payment) => {
    if (payment.status !== 'succeeded' || !isSameMonth(new Date(payment.createdAt), now)) return total;
    return total + (payment.commissionEarned ?? 0);
  }, 0);

  return {
    totalLeads: workspace.leads.length,
    pipelineLeads: workspace.leads.filter((lead) => !['closed', 'lost'].includes(lead.status)).length,
    activeClients: activeClients.length,
    activeMrr: activeClients.reduce((total, client) => total + client.monthlyValue, 0),
    dealsThisMonth,
    commissionThisMonth,
  };
}
