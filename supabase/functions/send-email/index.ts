import { handleOptions, json, requireEnv } from '../_shared/http.ts';
import { requireWorkspaceUser } from '../_shared/clients.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request); if (options) return options;
  try {
    const payload = await request.json();
    const { user, supabase } = await requireWorkspaceUser(request);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${requireEnv('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: requireEnv('RESEND_FROM_EMAIL'), to: [payload.toEmail], subject: payload.subject, text: payload.body }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Resend rejected the email');
    const { data: email, error } = await supabase.from('emails_sent').insert({ lead_id: payload.leadId, client_id: payload.clientId, sent_by: user.id, to_email: payload.toEmail, subject: payload.subject, body: payload.body, type: payload.type, provider_message_id: result.id }).select().single();
    if (error) throw error;
    await supabase.from('activities').insert({ lead_id: payload.leadId, client_id: payload.clientId, user_id: user.id, type: 'email', content: `Email sent: ${payload.subject}` });
    return json({ email });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Email failed' }, 400); }
});
