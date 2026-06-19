import { json, requireEnv } from '../_shared/http.ts';
import { serviceClient, stripeClient } from '../_shared/clients.ts';

Deno.serve(async (request) => {
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) return json({ error: 'Missing Stripe signature' }, 400);
    const stripe = stripeClient();
    const event = await stripe.webhooks.constructEventAsync(await request.text(), signature, requireEnv('STRIPE_WEBHOOK_SECRET'));
    const supabase = serviceClient();
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const clientId = session.metadata?.arkitech_client_id;
      if (clientId && session.mode === 'subscription') {
        await supabase.from('clients').update({ stripe_subscription_id: String(session.subscription), subscription_status: 'active' }).eq('id', clientId);
      }
      if (clientId && session.payment_intent) {
        const intent = await stripe.paymentIntents.retrieve(String(session.payment_intent));
        await supabase.from('payments').upsert({ client_id: clientId, stripe_payment_intent_id: intent.id, amount: intent.amount_received / 100, status: intent.status === 'succeeded' ? 'succeeded' : 'pending', type: 'one_time', commission_earned: intent.amount_received / 100 * .2 }, { onConflict: 'stripe_payment_intent_id' });
      }
    }
    if (event.type === 'invoice.payment_failed' || event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string' ? invoice.parent.subscription_details.subscription : invoice.parent?.subscription_details?.subscription?.id;
      if (subscriptionId) await supabase.from('clients').update({ subscription_status: event.type === 'invoice.paid' ? 'active' : 'past_due' }).eq('stripe_subscription_id', subscriptionId);
    }
    if (event.type === 'customer.subscription.deleted') {
      await supabase.from('clients').update({ subscription_status: 'canceled' }).eq('stripe_subscription_id', event.data.object.id);
    }
    return json({ received: true });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Webhook failed' }, 400); }
});
