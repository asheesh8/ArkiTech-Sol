import { motion } from 'framer-motion';
import { Building2, MapPin, Plus, Search, Star } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../app/WorkspaceProvider';
import { Avatar, Badge, Button, Card, EmptyState, Modal, pageMotion } from '../../components/ui';
import { filterLeads } from '../../domain/filters';
import type { LeadStatus } from '../../domain/types';

const statuses: Array<{ value: LeadStatus | 'all'; label: string }> = [{ value: 'all', label: 'All' }, { value: 'not_contacted', label: 'Not contacted' }, { value: 'pitched', label: 'Pitched' }, { value: 'follow_up', label: 'Follow up' }, { value: 'trial', label: 'Trial' }, { value: 'closed', label: 'Closed' }, { value: 'lost', label: 'Lost' }];

export function LeadsPage() {
  const { workspace, activeProfileId, createLead } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get('add') === 'true');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [assignee, setAssignee] = useState<string | 'all'>('all');
  const leads = useMemo(() => filterLeads(workspace.leads, { search, status, assignee }), [workspace.leads, search, status, assignee]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createLead({
      businessName: String(data.get('businessName')),
      ownerName: String(data.get('ownerName')),
      phone: String(data.get('phone')),
      email: String(data.get('email')),
      address: String(data.get('address')),
      city: String(data.get('city')),
      businessType: String(data.get('businessType') || 'Local business'),
      rating: null,
      reviewCount: null,
      lastReviewDate: null,
      notes: '',
      assignedTo: activeProfileId,
      createdBy: activeProfileId,
    });
    setOpen(false); setParams({}); toast.success('Lead added to the pipeline');
  }

  return <motion.section {...pageMotion} className="page-section">
    <div className="page-header"><div><h1>Lead pipeline</h1><p>Every conversation, one clear next move.</p></div><Button onClick={() => setOpen(true)}><Plus size={17} />Add lead</Button></div>
    <Card className="filter-card"><div className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search businesses, owners, or cities" aria-label="Search businesses" /></div><div className="status-pills">{statuses.map((item) => <button key={item.value} className={status === item.value ? 'active' : ''} onClick={() => setStatus(item.value)}>{item.label}</button>)}</div><select aria-label="Assigned to" value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="all">All owners</option><option value="profile-ashish">Ashish</option><option value="profile-terri">Terri</option></select></Card>
    {leads.length ? <div className="lead-grid">{leads.map((lead, index) => <motion.div key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }}><Link to={`/leads/${lead.id}`}><Card className="lead-card"><div className="lead-card-top"><div className="lead-logo"><Building2 /></div><Badge tone={lead.status}>{statuses.find((item) => item.value === lead.status)?.label}</Badge></div><div><h3>{lead.businessName}</h3><p>{lead.businessType}</p></div><div className="lead-metrics">{lead.rating ? <span><Star size={15} fill="currentColor" />{lead.rating} <small>({lead.reviewCount})</small></span> : <span className="muted">No review snapshot</span>}<span><MapPin size={14} />{lead.city}</span></div><div className="lead-card-foot"><span>Updated {new Date(lead.updatedAt).toLocaleDateString()}</span><Avatar initials={lead.assignedTo.includes('terri') ? 'TE' : 'AS'} tone={lead.assignedTo.includes('terri') ? 'purple' : 'blue'} /></div></Card></Link></motion.div>)}</div> : <EmptyState title="No leads match" body="Try clearing a filter, or add the next business to your pipeline." action={<Button onClick={() => setOpen(true)}>Add your first lead</Button>} />}
    <button className="fab" aria-label="New mobile lead" onClick={() => setOpen(true)}><Plus /></button>
    <Modal open={open} title="Add a lead" onClose={() => { setOpen(false); setParams({}); }}><form className="form-grid" onSubmit={handleSubmit}><label>Business name<input required name="businessName" autoFocus /></label><label>Owner name<input name="ownerName" /></label><label>Phone<input name="phone" type="tel" /></label><label>Email<input name="email" type="email" /></label><label>City<input required name="city" /></label><label>Business type<input name="businessType" placeholder="Dentist, restaurant, contractor..." /></label><label className="wide">Address<input name="address" /></label><div className="form-actions wide"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save lead</Button></div></form></Modal>
  </motion.section>;
}
