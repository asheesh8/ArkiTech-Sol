import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(url && anonKey);
export const supabase = hasSupabaseConfig ? createClient(url, anonKey, { auth: { persistSession: true, detectSessionInUrl: true } }) : null;

export function allowedEmails() {
  return String(import.meta.env.VITE_ALLOWED_EMAILS || '').split(',').map((email) => email.trim()).filter(Boolean);
}
