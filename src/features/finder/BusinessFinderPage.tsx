import { CalendarDays, Database, LogIn, SearchCheck, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { finderRepository, type FinderRepository } from './finderRepository';
import type { BusinessProfile, FinderProfileSettings, FinderSearchInput, ScheduledAppointment } from './finderTypes';
import { AppointmentAgenda } from './AppointmentAgenda';
import { BusinessResults } from './BusinessResults';
import { BusinessSearchForm } from './BusinessSearchForm';
import { OnboardingPanel } from './OnboardingPanel';

const initialSearch: FinderSearchInput = { category: '', location: '', website: '', limit: 20 };
const defaultSettings: FinderProfileSettings = { meetUrl: '', timezone: 'America/New_York' };

export function BusinessFinderPage({ repository = finderRepository }: { repository?: FinderRepository }) {
  const [search, setSearch] = useState(initialSearch);
  const [results, setResults] = useState<BusinessProfile[]>([]);
  const [selected, setSelected] = useState<BusinessProfile | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [appointments, setAppointments] = useState<ScheduledAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repository.isConfigured) return;
    Promise.all([repository.getProfileSettings(), repository.listUpcoming()])
      .then(([profile, upcoming]) => { setSettings(profile); setAppointments(upcoming); })
      .catch(() => { /* Search and onboarding actions surface actionable errors. */ });
  }, [repository]);

  const runSearch = async () => {
    setError('');
    setLoading(true);
    try {
      const businesses = await repository.search(search);
      setResults(businesses);
      setSelected(null);
      setSearched(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Business search failed.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="finder-app">
    <header className="finder-topbar">
      <Link to="/" className="finder-brand"><span className="brand-mark"><i /><i /></span><strong>ArkiTech</strong></Link>
      <div><span className="finder-connection"><i />Business intelligence</span><Link to="/login"><LogIn size={15} />Sign in</Link></div>
    </header>
    <main className="finder-main">
      <section className="finder-intro">
        <div><h1>Business Finder</h1><p>Find real local businesses, understand their Google profile, and schedule onboarding in one place.</p></div>
        <div className="finder-intro-meta"><SearchCheck size={18} /><span>Powered by Outscraper<br /><small>Live Google profile data</small></span></div>
      </section>

      {!repository.isConfigured ? <section className="finder-setup" role="status"><Database size={20} /><div><strong>Connect Supabase to run live searches</strong><span>Apply the included schemas and deploy the two Edge Functions. No sample results will be substituted.</span></div><code>docs/SUPABASE_SETUP.md</code></section> : null}
      <BusinessSearchForm value={search} loading={loading} onChange={setSearch} onSubmit={runSearch} />
      {error ? <div className="finder-error-banner" role="alert"><SlidersHorizontal size={17} /><span>{error}</span><button onClick={runSearch}>Retry</button></div> : null}

      <div className={`finder-workspace ${selected ? 'has-selection' : ''}`}>
        <section className="finder-results-panel">
          <div className="finder-section-title"><div><h2>Results</h2><p>{results.length ? `${results.length} businesses found` : 'Google Business Profile intelligence'}</p></div><span>{searched ? 'Latest search' : 'Ready to search'}</span></div>
          <BusinessResults results={results} selectedId={selected?.id} searched={searched} onSelect={setSelected} />
        </section>
        {selected ? <OnboardingPanel
          key={selected.id}
          business={selected}
          settings={settings}
          saving={saving}
          onClose={() => setSelected(null)}
          onSaveSettings={async (next) => { await repository.saveProfileSettings(next); setSettings(next); }}
          onSchedule={async (input) => {
            setSaving(true);
            try {
              const appointment = await repository.onboardAndSchedule(selected, input);
              setAppointments((current) => [...current, appointment].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
              return appointment;
            } finally { setSaving(false); }
          }}
          onSendInvite={(appointmentId) => repository.sendInvite(appointmentId)}
        /> : null}
      </div>
      <AppointmentAgenda appointments={appointments} />
    </main>
    <footer className="finder-footer"><span><CalendarDays size={14} />Built-in scheduling</span><span>Google Calendar ready</span></footer>
  </div>;
}
