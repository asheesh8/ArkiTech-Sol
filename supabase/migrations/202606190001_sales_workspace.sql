create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('ashish', 'terri')),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  owner_name text,
  phone text,
  email text,
  address text,
  city text,
  business_type text,
  google_rating numeric(2,1) check (google_rating between 0 and 5),
  google_review_count integer check (google_review_count >= 0),
  last_review_date date,
  competitor_data jsonb not null default '[]'::jsonb,
  notes text not null default '',
  status text not null default 'not_contacted' check (status in ('not_contacted', 'pitched', 'follow_up', 'trial', 'closed', 'lost')),
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id),
  business_name text not null,
  owner_name text,
  phone text,
  email text,
  address text,
  business_type text,
  plan text not null check (plan in ('trial', 'reviewtainer', 'ultraretainer', 'custom')),
  contract_term text not null check (contract_term in ('monthly', '6month', '12month', 'ip_buyout')),
  monthly_value numeric(8,2) not null default 0 check (monthly_value >= 0),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text not null default 'not_started' check (subscription_status in ('active', 'past_due', 'canceled', 'trialing', 'not_started')),
  trial_ends_at date,
  contract_start date not null default current_date,
  contract_end date,
  next_billing date,
  brought_by uuid references public.profiles(id),
  notes text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'churned')),
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  user_id uuid references public.profiles(id),
  type text not null check (type in ('call', 'visit', 'email', 'note', 'status_change', 'payment')),
  content text not null,
  created_at timestamptz not null default now(),
  constraint activities_subject_check check (lead_id is not null or client_id is not null)
);

create table if not exists public.emails_sent (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  sent_by uuid references public.profiles(id),
  to_email text not null,
  subject text not null,
  body text not null,
  type text not null check (type in ('follow_up', 'proposal', 'check_in', 'invoice', 'free_trial', 'custom')),
  provider_message_id text,
  sent_at timestamptz not null default now(),
  constraint emails_subject_check check (lead_id is not null or client_id is not null)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(8,2) not null check (amount > 0),
  status text not null check (status in ('succeeded', 'failed', 'pending')),
  type text not null check (type in ('subscription', 'one_time')),
  closed_by uuid references public.profiles(id),
  commission_earned numeric(8,2) not null default 0 check (commission_earned >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.review_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  rating numeric(2,1) not null check (rating between 0 and 5),
  review_count integer not null check (review_count >= 0),
  pulled_at timestamptz not null default now(),
  constraint review_snapshot_subject_check check (lead_id is not null or client_id is not null)
);

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_assigned_to_idx on public.leads(assigned_to);
create index if not exists leads_created_by_idx on public.leads(created_by);
create index if not exists clients_lead_id_idx on public.clients(lead_id);
create index if not exists clients_brought_by_idx on public.clients(brought_by);
create index if not exists clients_status_idx on public.clients(status);
create index if not exists activities_lead_id_created_at_idx on public.activities(lead_id, created_at desc);
create index if not exists activities_client_id_created_at_idx on public.activities(client_id, created_at desc);
create index if not exists activities_user_id_idx on public.activities(user_id);
create index if not exists emails_sent_lead_id_idx on public.emails_sent(lead_id);
create index if not exists emails_sent_client_id_idx on public.emails_sent(client_id);
create index if not exists emails_sent_sent_by_idx on public.emails_sent(sent_by);
create index if not exists payments_client_id_created_at_idx on public.payments(client_id, created_at desc);
create index if not exists payments_closed_by_idx on public.payments(closed_by);
create index if not exists review_snapshots_client_id_pulled_at_idx on public.review_snapshots(client_id, pulled_at);
create index if not exists review_snapshots_lead_id_pulled_at_idx on public.review_snapshots(lead_id, pulled_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();

create or replace function public.is_workspace_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()));
$$;

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.activities enable row level security;
alter table public.emails_sent enable row level security;
alter table public.payments enable row level security;
alter table public.review_snapshots enable row level security;

create policy "profiles read workspace" on public.profiles for select to authenticated using ((select public.is_workspace_member()));
create policy "profiles create self" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles update self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members manage leads" on public.leads for all to authenticated using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));
create policy "members manage clients" on public.clients for all to authenticated using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));
create policy "members manage activities" on public.activities for all to authenticated using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));
create policy "members read emails" on public.emails_sent for select to authenticated using ((select public.is_workspace_member()));
create policy "members read payments" on public.payments for select to authenticated using ((select public.is_workspace_member()));
create policy "members manage snapshots" on public.review_snapshots for all to authenticated using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));

revoke all on table public.emails_sent from anon, authenticated;
grant select on table public.emails_sent to authenticated;
revoke all on table public.payments from anon, authenticated;
grant select on table public.payments to authenticated;
