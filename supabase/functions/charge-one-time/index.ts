import { handleOptions, json } from '../_shared/http.ts';
import { requireWorkspaceUser, stripeClient } from '../_shared/clients.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request); if (options) return options;
  try {
    const { clientId, amount, description, returnUrl } = await request.json();
    const { supabase } = await requireWorkspaceUser(request);
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (error || !client.stripe_customer_id) throw new Error('Create the Stripe customer first');
    const session = await stripeClient().checkout.sessions.create({
      mode: 'payment',
      customer: client.stripe_customer_id,
      line_items: [{ price_data: { currency: 'usd', unit_amount: Math.round(Number(amount) * 100), product_data: { name: description || `ArkiTech-Sol work for ${client.business_name}` } }, quantity: 1 }],
      success_url: `${returnUrl}?payment=success`,
      cancel_url: `${returnUrl}?payment=canceled`,
      metadata: { arkitech_client_id: client.id, closed_by: (await supabase.auth.admin.getUserById(client.brought_by)).data.user?.id || '' },
    });
    return json({ url: session.url });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Charge setup failed' }, 400); }
});
