import { handleOptions, json } from '../_shared/http.ts';
import { requireWorkspaceUser, stripeClient } from '../_shared/clients.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request); if (options) return options;
  try {
    const { clientId } = await request.json();
    const { supabase } = await requireWorkspaceUser(request);
    const { data: client, error } = await supabase.from('clients').select('stripe_customer_id').eq('id', clientId).single();
    if (error || !client.stripe_customer_id) throw new Error('No Stripe customer');
    const intents = await stripeClient().paymentIntents.list({ customer: client.stripe_customer_id, limit: 100 });
    return json({ payments: intents.data.map((intent) => ({ id: intent.id, amount: intent.amount_received / 100, status: intent.status, createdAt: new Date(intent.created * 1000).toISOString() })) });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Payment history failed' }, 400); }
});
