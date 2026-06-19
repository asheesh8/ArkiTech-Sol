-- Run after 202606190001_sales_workspace.sql.
-- Adds real business discovery, onboarding, scheduling, and invitation delivery.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists meet_url text;
alter table public.profiles add column if not exists timezone text not null default 'America/New_York';

create table if not exists public.search_runs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  category text not null default '',
  location text not null default '',
  website_query text not null default '',
  provider_job_id text,
  status text not null default 'pending' check (status in ('pending', 'complete', 'failed')),
  result_count integer not null default 0 check (result_count >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint search_runs_query_check check (
    length(trim(website_query)) > 0 or
    (length(trim(category)) > 0 and length(trim(location)) > 0)
  )
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  google_place_id text,
  name text not null,
  category text not null default '',
  address text not null default '',
  city text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  google_maps_url text not null default '',
  rating numeric(2,1) check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  hours jsonb not null default '{}'::jsonb,
  raw_profile jsonb not null default '{}'::jsonb,
  status text not null default 'discovered' check (status in ('discovered', 'selected', 'onboarded', 'dismissed')),
  last_scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_results (
  search_run_id uuid not null references public.search_runs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  result_rank integer not null check (result_rank >= 0),
  created_at timestamptz not null default now(),
  primary key (search_run_id, business_id)
);

create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider_review_id text not null,
  author_name text not null default '',
  rating integer not null check (rating between 0 and 5),
  review_text text not null default '',
  review_date timestamptz,
  owner_response text,
  created_at timestamptz not null default now(),
  unique (business_id, provider_review_id)
);

alter table public.clients add column if not exists business_id uuid;
alter table public.clients add column if not exists contact_name text;
alter table public.clients add column if not exists contact_email text;
alter table public.clients add column if not exists contact_phone text;
alter table public.clients add column if not exists service text;
alter table public.clients alter column plan set default 'custom';
alter table public.clients alter column contract_term set default 'monthly';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_business_id_fkey'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_business_id_fkey
      foreign key (business_id) references public.businesses(id) on delete restrict;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_business_id_key'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients add constraint clients_business_id_key unique (business_id);
  end if;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/New_York',
  meet_url text not null default '',
  notes text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_check check (ends_at > starts_at)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  sent_by uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  provider_message_id text,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists search_runs_created_by_created_at_idx on public.search_runs(created_by, created_at desc);
create index if not exists search_runs_status_created_at_idx on public.search_runs(status, created_at desc);
create index if not exists businesses_status_updated_at_idx on public.businesses(status, updated_at desc);
create index if not exists businesses_city_category_idx on public.businesses(city, category);
create index if not exists search_results_business_id_idx on public.search_results(business_id);
create index if not exists search_results_run_rank_idx on public.search_results(search_run_id, result_rank);
create index if not exists business_reviews_business_date_idx on public.business_reviews(business_id, review_date desc);
create index if not exists clients_business_id_idx on public.clients(business_id);
create index if not exists appointments_client_id_idx on public.appointments(client_id);
create index if not exists appointments_created_by_starts_at_idx on public.appointments(created_by, starts_at);
create index if not exists appointments_status_starts_at_idx on public.appointments(status, starts_at);
create index if not exists invitations_appointment_id_created_at_idx on public.invitations(appointment_id, created_at desc);
create index if not exists invitations_sent_by_idx on public.invitations(sent_by);

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.search_runs enable row level security;
alter table public.businesses enable row level security;
alter table public.search_results enable row level security;
alter table public.business_reviews enable row level security;
alter table public.appointments enable row level security;
alter table public.invitations enable row level security;

drop policy if exists "members manage search runs" on public.search_runs;
create policy "members manage search runs" on public.search_runs for all to authenticated
using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));

drop policy if exists "members manage businesses" on public.businesses;
create policy "members manage businesses" on public.businesses for all to authenticated
using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));

drop policy if exists "members manage search results" on public.search_results;
create policy "members manage search results" on public.search_results for all to authenticated
using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));

drop policy if exists "members manage business reviews" on public.business_reviews;
create policy "members manage business reviews" on public.business_reviews for all to authenticated
using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));

drop policy if exists "members manage appointments" on public.appointments;
create policy "members manage appointments" on public.appointments for all to authenticated
using ((select public.is_workspace_member())) with check ((select public.is_workspace_member()));

drop policy if exists "members read invitations" on public.invitations;
create policy "members read invitations" on public.invitations for select to authenticated
using ((select public.is_workspace_member()));

revoke all on table public.search_runs, public.businesses, public.search_results,
  public.business_reviews, public.appointments, public.invitations from anon;
grant select, insert, update, delete on table public.search_runs, public.businesses,
  public.search_results, public.business_reviews, public.appointments to authenticated;
grant select on table public.invitations to authenticated;
