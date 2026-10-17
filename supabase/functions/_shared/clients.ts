import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@20';
import { requireEnv } from './http.ts';

// Service-role client: bypasses row-level security. Only use it after the caller
// has been checked (requireWorkspaceUser) or for trusted sources (Stripe webhook).
export function serviceClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

export function stripeClient() {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2026-02-25.clover',
    httpClient: Stripe.createFetchHttpClient(),
  });
}

// A valid token only proves the caller has a Supabase account, so membership is
// checked separately via a row in `profiles`. Note the "profiles create self" RLS
// policy lets any signed-in user insert their own row, so this is only as strict
// as the project's sign-up settings (keep public sign-ups disabled).
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
