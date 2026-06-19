import { motion } from 'framer-motion';
import { BarChart3, BriefcaseBusiness, ChevronLeft, LayoutDashboard, Settings, Sparkles, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Avatar, Badge } from '../components/ui';

const navigation = [
  { to: '/', label: 'Command', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/pitch', label: 'Review Tool', icon: Sparkles },
  { to: '/clients', label: 'Clients', icon: BriefcaseBusiness },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function Brand() {
  return <div className="brand"><span className="brand-mark"><i /><i /></span><span>ArkiTech-Sol</span></div>;
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return <nav className={mobile ? 'mobile-nav' : 'side-nav'} aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}>{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={mobile ? 20 : 19} strokeWidth={1.8} /><span>{mobile && label === 'Review Tool' ? 'Review' : label}</span>{!mobile ? <motion.i layoutId="active-rail" /> : null}</NavLink>)}</nav>;
}

export function AppShell() {
  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <Navigation />
      <div className="sidebar-insight"><BarChart3 size={16} /><div><strong>Proof compounds</strong><span>4 wins logged this month</span></div></div>
      <div className="profile-chip"><Avatar initials="AS" /><div><strong>Ashish</strong><span>Builder · Admin</span></div><ChevronLeft size={15} /></div>
    </aside>
    <div className="app-body">
      <div className="offline-banner" hidden={navigator.onLine}>You're offline — live changes are unavailable.</div>
      <header className="mobile-header"><Brand /><Badge tone="warning">Demo</Badge></header>
      <main className="page-canvas"><Outlet /></main>
      <Navigation mobile />
    </div>
  </div>;
}
