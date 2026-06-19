import { handleOptions, json, requireEnv } from '../_shared/http.ts';
import { requireWorkspaceUser, stripeClient } from '../_shared/clients.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request); if (options) return options;
  try {
    const { clientId, plan, returnUrl } = await request.json();
    const { supabase } = await requireWorkspaceUser(request);
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (error || !client.stripe_customer_id) throw new Error('Create the Stripe customer first');
    const price = plan === 'ultraretainer' ? requireEnv('STRIPE_ULTRARETAINER_PRICE_ID') : requireEnv('STRIPE_REVIEWTAINER_PRICE_ID');
    const session = await stripeClient().checkout.sessions.create({
      mode: 'subscription',
      customer: client.stripe_customer_id,
      line_items: [{ price, quantity: 1 }],
      success_url: `${returnUrl}?billing=success`,
      cancel_url: `${returnUrl}?billing=canceled`,
      subscription_data: { metadata: { arkitech_client_id: client.id } },
      metadata: { arkitech_client_id: client.id, plan },
    });
    return json({ url: session.url });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Subscription setup failed' }, 400); }
});
