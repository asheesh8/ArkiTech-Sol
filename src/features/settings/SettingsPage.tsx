import { LogOut, RefreshCcw, ShieldCheck, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from '../../app/WorkspaceProvider';
import { Avatar, Badge, Button, Card } from '../../components/ui';

export function SettingsPage() {
  const { resetDemo } = useWorkspace();
  return <section className="page-section"><div className="page-header"><div><h1>Settings</h1><p>Two people. One operating picture.</p></div><Badge tone="warning">Demo workspace</Badge></div><div className="settings-grid"><Card className="profile-settings"><Avatar initials="AS" /><div><h2>Ashish</h2><p>Builder · Admin</p></div><Badge tone="success">Active</Badge></Card><Card><div className="settings-row"><ShieldCheck /><div><strong>Workspace access</strong><span>Ashish and Terri only</span></div><Badge tone="success">Protected</Badge></div><div className="settings-row"><Smartphone /><div><strong>Installable PWA</strong><span>Add ArkiTech-Sol to the iPhone home screen</span></div><Badge tone="blue">Ready</Badge></div><div className="settings-row"><RefreshCcw /><div><strong>Reset demo data</strong><span>Restore the seeded workspace and clear local changes</span></div><Button variant="secondary" onClick={async () => { if (window.confirm('Reset all demo data?')) { await resetDemo(); toast.success('Demo workspace reset'); } }}>Reset</Button></div></Card><Card><div className="settings-row"><div><strong>ArkiTech-Sol</strong><span>Internal sales and client operations · Version 2.0.0</span></div><Button variant="ghost"><LogOut size={16} />Sign out</Button></div></Card></div></section>;
}
