import { CalendarDays, Clock3, Video } from 'lucide-react';
import type { ScheduledAppointment } from './finderTypes';

export function AppointmentAgenda({ appointments }: { appointments: ScheduledAppointment[] }) {
  return <section className="appointment-agenda">
    <div className="finder-section-title"><div><h2>Upcoming appointments</h2><p>Your built-in onboarding calendar.</p></div><CalendarDays size={19} /></div>
    {appointments.length ? <div className="agenda-list">{appointments.map((appointment) => <article key={appointment.id}>
      <time dateTime={appointment.startsAt}><strong>{new Date(appointment.startsAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</strong><span>{new Date(appointment.startsAt).toLocaleDateString([], { weekday: 'short' })}</span></time>
      <div><strong>{appointment.businessName}</strong><span><Clock3 size={12} />{new Date(appointment.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
      {appointment.meetUrl ? <a href={appointment.meetUrl} target="_blank" rel="noreferrer" aria-label={`Open Meet for ${appointment.businessName}`}><Video size={15} /></a> : null}
    </article>)}</div> : <p className="agenda-empty">Scheduled onboarding sessions will appear here.</p>}
  </section>;
}
