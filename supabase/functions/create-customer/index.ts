import { handleOptions, json } from '../_shared/http.ts';
import { requireWorkspaceUser, stripeClient } from '../_shared/clients.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request); if (options) return options;
  try {
    const { clientId } = await request.json();
    const { supabase } = await requireWorkspaceUser(request);
    const { data: client, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (error) throw error;
    if (client.stripe_customer_id) return json({ customerId: client.stripe_customer_id });
    const customer = await stripeClient().customers.create({
      name: client.business_name,
      email: client.email || undefined,
      phone: client.phone || undefined,
      metadata: { arkitech_client_id: client.id },
    });
    await supabase.from('clients').update({ stripe_customer_id: customer.id }).eq('id', client.id);
    return json({ customerId: customer.id });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Customer creation failed' }, 400); }
});
