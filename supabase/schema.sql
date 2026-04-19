create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamp with time zone default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_title text not null,
  doc_url text not null,
  google_doc_id text not null,
  total_revisions integer default 0,
  total_collaborators integer default 0,
  overall_summary text,
  created_at timestamp with time zone default now()
);

create table if not exists public.contributors (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  contributor_name text not null,
  contributor_email text,
  contribution_percent numeric,
  originality_score integer,
  significance_score integer,
  writing_quality_score integer,
  summary text,
  raw_text_added text,
  created_at timestamp with time zone default now()
);

create table if not exists public.google_connections (
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'google',
  scopes text[] default '{}',
  encrypted_refresh_token text,
  access_token_expires_at timestamp with time zone,
  connected_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status text not null default 'token_unavailable' check (
    status in ('connected', 'needs_reconnect', 'token_unavailable')
  ),
  primary key (user_id, provider)
);

create index if not exists reports_user_id_created_at_idx on public.reports(user_id, created_at desc);
create index if not exists reports_google_doc_id_idx on public.reports(google_doc_id);
create index if not exists contributors_report_id_idx on public.contributors(report_id);
create index if not exists google_connections_user_id_status_idx on public.google_connections(user_id, status);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.contributors enable row level security;
alter table public.google_connections enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Users can view their own reports" on public.reports;
drop policy if exists "Users can create their own reports" on public.reports;
drop policy if exists "Users can update their own reports" on public.reports;
drop policy if exists "Users can delete their own reports" on public.reports;

drop policy if exists "Users can view contributor rows for owned reports" on public.contributors;
drop policy if exists "Users can create contributor rows for owned reports" on public.contributors;
drop policy if exists "Users can update contributor rows for owned reports" on public.contributors;
drop policy if exists "Users can delete contributor rows for owned reports" on public.contributors;

drop policy if exists "Users cannot read google connections directly" on public.google_connections;
drop policy if exists "Users cannot insert google connections directly" on public.google_connections;
drop policy if exists "Users cannot update google connections directly" on public.google_connections;
drop policy if exists "Users cannot delete google connections directly" on public.google_connections;

create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can view their own reports"
on public.reports for select
using (auth.uid() = user_id);

create policy "Users can create their own reports"
on public.reports for insert
with check (auth.uid() = user_id);

create policy "Users can update their own reports"
on public.reports for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own reports"
on public.reports for delete
using (auth.uid() = user_id);

create policy "Users can view contributor rows for owned reports"
on public.contributors for select
using (
  exists (
    select 1
    from public.reports
    where reports.id = contributors.report_id
      and reports.user_id = auth.uid()
  )
);

create policy "Users can create contributor rows for owned reports"
on public.contributors for insert
with check (
  exists (
    select 1
    from public.reports
    where reports.id = contributors.report_id
      and reports.user_id = auth.uid()
  )
);

create policy "Users can update contributor rows for owned reports"
on public.contributors for update
using (
  exists (
    select 1
    from public.reports
    where reports.id = contributors.report_id
      and reports.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.reports
    where reports.id = contributors.report_id
      and reports.user_id = auth.uid()
  )
);

create policy "Users can delete contributor rows for owned reports"
on public.contributors for delete
using (
  exists (
    select 1
    from public.reports
    where reports.id = contributors.report_id
      and reports.user_id = auth.uid()
  )
);

create policy "Users cannot read google connections directly"
on public.google_connections for select
using (false);

create policy "Users cannot insert google connections directly"
on public.google_connections for insert
with check (false);

create policy "Users cannot update google connections directly"
on public.google_connections for update
using (false)
with check (false);

create policy "Users cannot delete google connections directly"
on public.google_connections for delete
using (false);
