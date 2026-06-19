import { motion } from 'framer-motion';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { isAllowedEmail } from '../../domain/access';
import { allowedEmails, supabase } from '../../data/supabase/client';

export function LoginPage() {
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const email = String(new FormData(event.currentTarget).get('email')); const allowlist = allowedEmails(); if (allowlist.length && !isAllowedEmail(email, allowlist)) { toast.error('Access denied'); return; } if (!supabase) { toast.error('Supabase is not configured'); return; } const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }); if (error) { toast.error(error.message); return; } setSent(true); }
  return <main className="login-page"><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="login-wrap"><div className="login-brand"><span className="brand-mark"><i /><i /></span><strong>ArkiTech-Sol</strong></div><Card className="login-card"><span className="signal-icon"><LockKeyhole /></span><h1>{sent ? 'Check your inbox' : 'Internal access only'}</h1><p>{sent ? 'Use the secure link we sent to finish signing in.' : 'Ashish and Terri share one operating picture. No client portal, no public signup.'}</p>{!sent ? <form onSubmit={submit}><label>Work email<input required name="email" type="email" placeholder="you@arkitech-sol.com" /></label><Button type="submit">Send magic link <ArrowRight size={16} /></Button></form> : null}<div className="login-divider"><span>or</span></div><Link to="/"><Button variant="secondary"><Sparkles size={15} />Open UI demo</Button></Link></Card></motion.div></main>;
}
