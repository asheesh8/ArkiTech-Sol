import type { Lead, LeadStatus } from './types';

export interface LeadFilters {
  search: string;
  status: LeadStatus | 'all';
  assignee: string | 'all';
}

export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  const search = filters.search.trim().toLowerCase();
  return leads.filter((lead) => {
    const matchesSearch = !search || `${lead.businessName} ${lead.ownerName} ${lead.businessType} ${lead.city}`.toLowerCase().includes(search);
    const matchesStatus = filters.status === 'all' || lead.status === filters.status;
    const matchesAssignee = filters.assignee === 'all' || lead.assignedTo === filters.assignee;
    return matchesSearch && matchesStatus && matchesAssignee;
  });
}
