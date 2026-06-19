import { handleOptions, json, requireEnv } from '../_shared/http.ts';
import { requireWorkspaceUser } from '../_shared/clients.ts';

const compactUtc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const escapeIcs = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const encodeBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

function calendarUrl(appointment: Record<string, string>) {
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: appointment.title,
    dates: `${compactUtc(appointment.starts_at)}/${compactUtc(appointment.ends_at)}`,
    details: appointment.notes || 'ArkiTech client onboarding appointment', location: appointment.meet_url,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function ics(appointment: Record<string, string>) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ArkiTech//Client Onboarding//EN',
    'CALSCALE:GREGORIAN', 'METHOD:REQUEST', 'BEGIN:VEVENT',
    `UID:${appointment.id}@arkitech.solutions`, `DTSTAMP:${compactUtc(new Date().toISOString())}`,
    `DTSTART:${compactUtc(appointment.starts_at)}`, `DTEND:${compactUtc(appointment.ends_at)}`,
    `SUMMARY:${escapeIcs(appointment.title)}`, `DESCRIPTION:${escapeIcs(appointment.notes || 'ArkiTech client onboarding appointment')}`,
    `LOCATION:${escapeIcs(appointment.meet_url)}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  let invitationId: string | null = null;

  try {
    const payload = await request.json();
    if (!payload.appointmentId) return json({ error: 'Appointment is required.' }, 400);
    const { user, supabase } = await requireWorkspaceUser(request);
    const { data: appointment, error } = await supabase.from('appointments')
      .select('*, clients!inner(id, business_name, contact_name, contact_email, email)')
      .eq('id', payload.appointmentId).single();
    if (error || !appointment) throw new Error('Appointment not found.');
    const client = appointment.clients;
    const recipientEmail = client.contact_email || client.email;
    if (!recipientEmail) throw new Error('Add a client email before sending the invite.');
    if (!appointment.meet_url) throw new Error('Add your reusable Google Meet link before sending the invite.');

    const { data: invitation, error: invitationError } = await supabase.from('invitations').insert({
      appointment_id: appointment.id, sent_by: user.id, recipient_email: recipientEmail, delivery_status: 'pending',
    }).select('id').single();
    if (invitationError) throw invitationError;
    invitationId = invitation.id;

    const addToCalendar = calendarUrl(appointment);
    const starts = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: appointment.timezone }).format(new Date(appointment.starts_at));
    const html = `<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h2>Your ArkiTech onboarding is scheduled</h2><p>Hi ${client.contact_name || 'there'},</p><p>Your onboarding for <strong>${client.business_name}</strong> is scheduled for ${starts}.</p><p><a href="${appointment.meet_url}" style="background:#5146e5;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">Join Google Meet</a></p><p><a href="${addToCalendar}">Add to Google Calendar</a></p></div>`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${requireEnv('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: requireEnv('RESEND_FROM_EMAIL'), to: [recipientEmail], subject: appointment.title, html,
        attachments: [{ filename: 'arkitech-onboarding.ics', content: encodeBase64(ics(appointment)) }],
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || 'Resend rejected the invitation.');
    await supabase.from('invitations').update({
      delivery_status: 'sent', provider_message_id: result.id, sent_at: new Date().toISOString(), error_message: null,
    }).eq('id', invitation.id);
    return json({ invitationId: invitation.id, providerMessageId: result.id, addToCalendar });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invitation failed.';
    try {
      if (invitationId) {
        const { supabase } = await requireWorkspaceUser(request);
        await supabase.from('invitations').update({ delivery_status: 'failed', error_message: message }).eq('id', invitationId);
      }
    } catch { /* preserve delivery error */ }
    return json({ error: message }, message === 'Unauthorized' || message === 'Access denied' ? 401 : 400);
  }
});
