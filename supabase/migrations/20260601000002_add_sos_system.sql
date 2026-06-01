-- Civilian SOS Emergency Request System

-- ============================================================
-- 1. Custom types for SOS system
-- ============================================================
create type public.emergency_type as enum (
  'medical',
  'fire',
  'flood',
  'earthquake',
  'cyclone',
  'landslide',
  'structural_collapse',
  'road_accident',
  'missing_person',
  'other'
);

create type public.sos_severity as enum (
  'critical',
  'high',
  'moderate',
  'low'
);

create type public.sos_status as enum (
  'pending',
  'acknowledged',
  'in_progress',
  'rescued',
  'closed',
  'cancelled'
);

create type public.assignment_role as enum (
  'rescuer',
  'medic',
  'coordinator',
  'driver',
  'spotter'
);

-- ============================================================
-- 3. sos_requests
-- ============================================================
create table public.sos_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emergency_type public.emergency_type not null,
  severity public.sos_severity not null default 'high',
  adults_count int not null default 0,
  children_count int not null default 0,
  elderly_count int not null default 0,
  injured_count int not null default 0,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  description text,
  immediate_needs jsonb not null default '[]'::jsonb,
  accessibility_flags jsonb not null default '{}'::jsonb,
  phone_number text,
  alternate_contact text,
  status public.sos_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.sos_requests.ticket_number is 'Human-readable ID like SOS-20260601-A3X9K';
comment on column public.sos_requests.immediate_needs is 'Array of need strings e.g. ["medical","food","water"]';
comment on column public.sos_requests.accessibility_flags is 'JSON object e.g. {"wheelchair":true,"stretcher_needed":false}';
comment on column public.sos_requests.severity is 'Critical (life-threatening), High, Moderate, Low';

create unique index sos_requests_ticket_idx on public.sos_requests (ticket_number);
create index sos_requests_user_id_idx on public.sos_requests (user_id);
create index sos_requests_status_idx on public.sos_requests (status);
create index sos_requests_created_at_idx on public.sos_requests (created_at desc);
create index sos_requests_location_idx on public.sos_requests (latitude, longitude);
create index sos_requests_severity_idx on public.sos_requests (severity);

-- Auto-generate ticket number on insert
create or replace function public.generate_sos_ticket()
returns trigger
language plpgsql
as $$
declare
  rand_suffix text;
begin
  rand_suffix := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
  new.ticket_number := 'SOS-' || to_char(now(), 'YYYYMMDD') || '-' || rand_suffix;
  return new;
end;
$$;

create trigger sos_requests_generate_ticket
  before insert on public.sos_requests
  for each row
  when (new.ticket_number is null or new.ticket_number = '')
  execute function public.generate_sos_ticket();

create trigger sos_requests_set_updated_at
  before update on public.sos_requests
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 4. sos_media
-- ============================================================
create table public.sos_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.sos_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video', 'audio')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

comment on column public.sos_media.storage_path is 'Path in Supabase Storage bucket eg sos-media/abc123.jpg';

create index sos_media_request_id_idx on public.sos_media (request_id);
create index sos_media_user_id_idx on public.sos_media (user_id);

-- ============================================================
-- 5. rescue_assignments
-- ============================================================
create table public.rescue_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.sos_requests (id) on delete cascade,
  assigned_team text not null,
  assigned_role public.assignment_role not null default 'rescuer',
  assigned_to uuid not null references public.profiles (id) on delete cascade,
  eta int,
  dispatch_time timestamptz,
  completion_time timestamptz,
  created_at timestamptz not null default now()
);

comment on column public.rescue_assignments.eta is 'Estimated arrival in minutes';
comment on column public.rescue_assignments.dispatch_time is 'When the team was dispatched';
comment on column public.rescue_assignments.completion_time is 'When the rescue operation completed';

create index rescue_assignments_request_id_idx on public.rescue_assignments (request_id);
create index rescue_assignments_assigned_to_idx on public.rescue_assignments (assigned_to);
create index rescue_assignments_team_idx on public.rescue_assignments (assigned_team);

-- ============================================================
-- 6. request_status_history
-- ============================================================
create table public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.sos_requests (id) on delete cascade,
  old_status public.sos_status,
  new_status public.sos_status not null,
  changed_by uuid not null references public.profiles (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.request_status_history is 'Audit log of all status changes on SOS requests';

create index req_status_history_request_id_idx on public.request_status_history (request_id);
create index req_status_history_created_at_idx on public.request_status_history (created_at desc);

-- Auto-log status changes via trigger
create or replace function public.log_sos_status_change()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status then
    insert into public.request_status_history (request_id, old_status, new_status, changed_by, notes)
    values (new.id, old.status, new.status, coalesce(new.user_id, auth.uid()), 'Status updated via trigger');
  end if;
  return new;
end;
$$;

create trigger sos_requests_log_status
  after update on public.sos_requests
  for each row
  when (old.status is distinct from new.status)
  execute function public.log_sos_status_change();

-- ============================================================
-- 7. Row Level Security
-- ============================================================

-- --- profiles ---
alter table public.profiles enable row level security;

-- (keep existing policies from initial_schema; add civilian-friendly policy)
create policy "Profiles are insertable by owner"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Helper: check if the authenticated user's profile is a responder (any role except Volunteer)
create or replace function public.is_responder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role is distinct from 'Volunteer'
  );
$$;

-- --- sos_requests ---
alter table public.sos_requests enable row level security;

create policy "Users can create their own SOS requests"
  on public.sos_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view SOS requests they own or are a responder"
  on public.sos_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_responder()
  );

create policy "Users can update their own SOS requests"
  on public.sos_requests
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Responders can update SOS request status"
  on public.sos_requests
  for update
  to authenticated
  using (public.is_responder())
  with check (public.is_responder());

-- --- sos_media ---
alter table public.sos_media enable row level security;

create policy "Users can upload media for their requests"
  on public.sos_media
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.sos_requests
      where id = request_id and user_id = auth.uid()
    )
  );

create policy "Users can view media on their or visible requests"
  on public.sos_media
  for select
  to authenticated
  using (
    exists (
      select 1 from public.sos_requests
      where id = request_id
        and (user_id = auth.uid() or public.is_responder())
    )
  );

-- --- rescue_assignments ---
alter table public.rescue_assignments enable row level security;

create policy "Responders can create assignments"
  on public.rescue_assignments
  for insert
  to authenticated
  with check (public.is_responder());

create policy "Responders can view all assignments"
  on public.rescue_assignments
  for select
  to authenticated
  using (public.is_responder());

create policy "Request owners can view their assignments"
  on public.rescue_assignments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.sos_requests
      where id = request_id and user_id = auth.uid()
    )
  );

create policy "Responders can update assignments"
  on public.rescue_assignments
  for update
  to authenticated
  using (public.is_responder())
  with check (public.is_responder());

-- --- request_status_history ---
alter table public.request_status_history enable row level security;

create policy "Responders can insert status history"
  on public.request_status_history
  for insert
  to authenticated
  with check (public.is_responder());

create policy "Request owners can view their status history"
  on public.request_status_history
  for select
  to authenticated
  using (
    exists (
      select 1 from public.sos_requests
      where id = request_id and user_id = auth.uid()
    )
  );

create policy "Responders can view status history"
  on public.request_status_history
  for select
  to authenticated
  using (public.is_responder());
