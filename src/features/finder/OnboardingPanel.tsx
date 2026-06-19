import { CalendarPlus, CheckCircle2, Mail, Save, Star, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui';
import { buildGoogleCalendarUrl } from './finderDomain';
import type { BusinessProfile, FinderClientInput, FinderProfileSettings, ScheduledAppointment } from './finderTypes';

interface Props {
  business: BusinessProfile;
  settings: FinderProfileSettings;
  saving: boolean;
  onClose(): void;
  onSaveSettings(settings: FinderProfileSettings): Promise<void>;
  onSchedule(input: FinderClientInput): Promise<ScheduledAppointment>;
  onSendInvite(appointmentId: string): Promise<void>;
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function OnboardingPanel({ business, settings, saving, onClose, onSaveSettings, onSchedule, onSendInvite }: Props) {
  const [form, setForm] = useState({ contactName: '', contactEmail: business.email, contactPhone: business.phone, service: 'Review growth', notes: '', appointmentDate: '', appointmentTime: '', durationMinutes: 30 });
  const [profile, setProfile] = useState(settings);
  const [error, setError] = useState('');
  const [scheduled, setScheduled] = useState<ScheduledAppointment | null>(null);
  const [inviteState, setInviteState] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.contactName.trim() || !form.contactEmail.trim()) return setError('Add the client contact name and email.');
    if (!form.appointmentDate || !form.appointmentTime) return setError('Choose an appointment date and time.');
    if (!profile.meetUrl.trim()) return setError('Add your reusable Google Meet link.');
    try {
      await onSaveSettings(profile);
      setScheduled(await onSchedule({ businessId: business.id ?? '', ...form, meetUrl: profile.meetUrl, timezone: profile.timezone }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not schedule onboarding.');
    }
  };

  if (scheduled) {
    const calendarUrl = buildGoogleCalendarUrl({ title: scheduled.title, startsAt: scheduled.startsAt, endsAt: scheduled.endsAt, description: scheduled.notes || 'ArkiTech client onboarding appointment', location: scheduled.meetUrl });
    return <aside className="onboarding-panel onboarding-success">
      <CheckCircle2 size={34} />
      <p>Onboarding scheduled</p>
      <h2>{scheduled.businessName}</h2>
      <span>{new Date(scheduled.startsAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</span>
      <a className="button button-secondary" href={calendarUrl} target="_blank" rel="noreferrer"><CalendarPlus size={16} />Add to Google Calendar</a>
      <Button onClick={async () => { setInviteState('Sending…'); try { await onSendInvite(scheduled.id); setInviteState('Invite sent'); } catch (reason) { setInviteState(reason instanceof Error ? reason.message : 'Invite failed'); } }}><Mail size={16} />Send invite</Button>
      {inviteState ? <small role="status">{inviteState}</small> : null}
      <Button variant="ghost" onClick={onClose}>Close</Button>
    </aside>;
  }

  return <aside className="onboarding-panel">
    <button className="finder-close" onClick={onClose} aria-label="Close onboarding"><X size={18} /></button>
    <div className="onboarding-business"><span>{business.category || 'Local business'}</span><h2>Onboard {business.name}</h2><p>{business.address}</p><div><strong><Star size={14} fill="currentColor" />{business.rating?.toFixed(1) ?? '—'}</strong><span>{business.reviewCount} Google reviews</span></div></div>
    <form onSubmit={submit}>
      <div className="onboarding-fields">
        <label><span>Contact name</span><input aria-label="Contact name" value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} /></label>
        <label><span>Contact email</span><input aria-label="Contact email" type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} /></label>
        <label><span>Contact phone</span><input aria-label="Contact phone" value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} /></label>
        <label><span>Service</span><select aria-label="Service" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}><option>Review growth</option><option>Website & SEO</option><option>Full growth system</option><option>Custom</option></select></label>
        <label><span>Appointment date</span><input aria-label="Appointment date" type="date" min={tomorrow()} value={form.appointmentDate} onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })} /></label>
        <label><span>Appointment time</span><input aria-label="Appointment time" type="time" value={form.appointmentTime} onChange={(event) => setForm({ ...form, appointmentTime: event.target.value })} /></label>
        <label><span>Duration</span><select aria-label="Duration" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })}><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label>
        <label><span>Timezone</span><select aria-label="Timezone" value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}><option>America/New_York</option><option>America/Chicago</option><option>America/Denver</option><option>America/Los_Angeles</option></select></label>
        <label className="wide"><span>Reusable Google Meet link</span><input aria-label="Reusable Google Meet link" type="url" value={profile.meetUrl} onChange={(event) => setProfile({ ...profile, meetUrl: event.target.value })} placeholder="https://meet.google.com/…" /></label>
        <label className="wide"><span>Notes</span><textarea aria-label="Onboarding notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="What should the onboarding call cover?" /></label>
      </div>
      {business.recentReviews.length ? <div className="review-preview"><span>Recent review</span><p>“{business.recentReviews[0].text}”</p><small>{business.recentReviews[0].authorName}</small></div> : null}
      {error ? <p className="finder-error" role="alert">{error}</p> : null}
      <Button type="submit" disabled={saving}><Save size={16} />{saving ? 'Scheduling…' : 'Onboard & Schedule'}</Button>
    </form>
  </aside>;
}
