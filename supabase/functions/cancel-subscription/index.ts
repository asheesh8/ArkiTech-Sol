import { handleOptions, json } from '../_shared/http.ts';
import { requireWorkspaceUser, stripeClient } from '../_shared/clients.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request); if (options) return options;
  try {
    const { clientId } = await request.json();
    const { supabase } = await requireWorkspaceUser(request);
    const { data: client, error } = await supabase.from('clients').select('stripe_subscription_id').eq('id', clientId).single();
    if (error || !client.stripe_subscription_id) throw new Error('No active subscription');
    const subscription = await stripeClient().subscriptions.update(client.stripe_subscription_id, { cancel_at_period_end: true });
    return json({ subscriptionId: subscription.id, cancelAt: subscription.cancel_at });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Cancellation failed' }, 400); }
});
