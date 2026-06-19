import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, CalendarClock, CircleDollarSign, Mail, PhoneCall, Plus, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, Badge, Button, Card, pageMotion } from '../../components/ui';
import { calculateDashboardMetrics } from '../../domain/metrics';
import { useWorkspace } from '../../app/WorkspaceProvider';

const statusLabel = { not_contacted: 'Not contacted', pitched: 'Pitched', follow_up: 'Follow up', trial: 'Trial', closed: 'Closed', lost: 'Lost' };

export function DashboardPage() {
  const { workspace } = useWorkspace();
  const metrics = calculateDashboardMetrics(workspace);
  const followUps = workspace.leads.filter((lead) => ['follow_up', 'pitched', 'trial'].includes(lead.status)).slice(0, 4);
  const cards = [
    { label: 'Active clients', value: metrics.activeClients, icon: BriefcaseBusiness, tone: 'purple', note: '+1 this month' },
    { label: 'MRR', value: `$${metrics.activeMrr.toLocaleString()}`, icon: CircleDollarSign, tone: 'green', note: 'Recurring revenue' },
    { label: 'Leads in pipeline', value: metrics.pipelineLeads, icon: Users, tone: 'blue', note: '3 need attention' },
    { label: 'Deals closed', value: metrics.dealsThisMonth, icon: TrendingUp, tone: 'amber', note: 'This month' },
  ];

  return <motion.section {...pageMotion} className="page-section">
    <div className="page-header dashboard-header">
      <div><h1>Good morning, Ashish</h1><p>Close the gaps. Show the proof.</p></div>
      <div className="header-actions"><Badge tone="warning">Demo workspace</Badge><span className="online-state"><i />Online</span><Link to="/leads?add=true"><Button><Plus size={17} />Add lead</Button></Link></div>
    </div>
    <div className="stat-grid">{cards.map(({ label, value, icon: Icon, tone, note }, index) => <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}><Card className="stat-card"><div className={`stat-icon stat-${tone}`}><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><svg viewBox="0 0 64 28" aria-hidden="true"><path d="M2 23 C13 18, 16 26, 25 15 S42 19, 48 8 S57 13, 62 2" /></svg></Card></motion.div>)}</div>
    <div className="dashboard-grid">
      <Card className="follow-card"><div className="section-heading"><div><h2>Follow-up queue</h2><span>{followUps.length} conversations need a move</span></div><Link to="/leads">View all <ArrowRight size={14} /></Link></div><div className="follow-table"><div className="follow-head"><span>Lead</span><span>Next move</span><span>Status</span><span>Owner</span></div>{followUps.map((lead) => <Link className="follow-row" to={`/leads/${lead.id}`} key={lead.id}><div className="lead-identity"><Avatar initials={lead.businessName.split(' ').map((word) => word[0]).join('').slice(0, 2)} tone={lead.assignedTo.includes('terri') ? 'purple' : 'blue'} /><div><strong>{lead.businessName}</strong><span>{lead.businessType} · {lead.city}</span></div></div><span className="next-move"><CalendarClock size={15} />{lead.status === 'follow_up' ? 'Call back today' : 'Send proof email'}</span><Badge tone={lead.status}>{statusLabel[lead.status]}</Badge><Avatar initials={lead.assignedTo.includes('terri') ? 'TE' : 'AS'} tone={lead.assignedTo.includes('terri') ? 'purple' : 'blue'} /></Link>)}</div></Card>
      <Card className="pipeline-card"><div className="section-heading"><div><h2>Pipeline signal</h2><span>Where attention converts</span></div><Badge tone="success">Healthy</Badge></div><div className="pipeline-bars">{(['not_contacted', 'pitched', 'follow_up', 'trial'] as const).map((status, index) => { const count = workspace.leads.filter((lead) => lead.status === status).length; return <div key={status}><div><span>{statusLabel[status]}</span><strong>{count}</strong></div><i><b style={{ width: `${Math.max(18, count * 26 + index * 8)}%` }} /></i></div>; })}</div><div className="proof-callout"><Sparkles size={17} /><div><strong>The next best move</strong><span>Harbor Dental has a 147-review competitor gap.</span></div><Link to="/pitch">Open review tool</Link></div></Card>
      <Card className="activity-card"><div className="section-heading"><div><h2>Recent activity</h2><span>Shared across leads and clients</span></div><span>Latest first</span></div><div className="activity-list">{workspace.activities.slice(0, 5).map((activity) => { const lead = workspace.leads.find((item) => item.id === activity.leadId); const Icon = activity.type === 'call' ? PhoneCall : activity.type === 'email' ? Mail : Sparkles; return <div className="activity-item" key={activity.id}><span className="activity-icon"><Icon size={15} /></span><div><strong>{activity.content}</strong><span>{lead?.businessName ?? 'Client account'} · {new Date(activity.createdAt).toLocaleDateString()}</span></div></div>; })}</div></Card>
      <Card className="quick-card"><div className="section-heading"><div><h2>Quick actions</h2><span>Move the work forward</span></div></div><div className="quick-grid"><Link to="/leads?add=true"><Plus /><strong>Add lead</strong><span>Capture a business</span></Link><Link to="/pitch"><Sparkles /><strong>Review lookup</strong><span>Build proof live</span></Link><button><Mail /><strong>New email</strong><span>Use a template</span></button><Link to="/clients"><CircleDollarSign /><strong>Charge client</strong><span>Open billing</span></Link></div></Card>
    </div>
  </motion.section>;
}
