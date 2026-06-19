import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@20';
import { requireEnv } from './http.ts';

export function serviceClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

export function stripeClient() {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2026-02-25.clover',
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function requireWorkspaceUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  const supabase = serviceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!profile) throw new Error('Access denied');
  return { user, supabase };
}
