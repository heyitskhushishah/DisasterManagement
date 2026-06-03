-- Role-based access control for SOS system
-- Creates a new app_role enum + column, migrates data, adds helper function

-- ============================================================
-- 1. New app_role type (clean slate, independent of worker_role)
-- ============================================================
create type public.app_role as enum (
  'civilian',
  'admin',
  'coordinator',
  'rescue_team',
  'ambulance_team',
  'fire_response',
  'volunteer_coordinator'
);

-- Add a new nullable app_role column to profiles
alter table public.profiles
  add column if not exists app_role public.app_role;

-- Migrate existing worker_role values to new app_role
update public.profiles
  set app_role = 'civilian'
  where role = 'Volunteer' and app_role is null;

update public.profiles
  set app_role = 'admin'
  where role in ('Disaster Coordinator') and app_role is null;

update public.profiles
  set app_role = 'coordinator'
  where role = 'Police' and app_role is null;

update public.profiles
  set app_role = 'rescue_team'
  where role in ('Rescue Worker') and app_role is null;

update public.profiles
  set app_role = 'ambulance_team'
  where role in ('Medical Staff') and app_role is null;

update public.profiles
  set app_role = 'fire_response'
  where role in ('Fire Department') and app_role is null;

-- Default new profiles to civilian
alter table public.profiles
  alter column app_role set default 'civilian'::public.app_role;

comment on column public.profiles.app_role is 'Application-level role for RBAC: civilian, admin, coordinator, rescue_team, ambulance_team, fire_response, volunteer_coordinator';

-- ============================================================
-- 2. Helper: sync app_role to auth.users.raw_app_meta_data
--    so the JWT contains the role for fast middleware checks
-- ============================================================
create or replace function public.sync_app_role_to_auth()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if new.app_role is distinct from old.app_role then
    update auth.users
    set raw_app_meta_data =
      raw_app_meta_data || jsonb_build_object('app_role', new.app_role)
    where id = new.id;
  end if;
  return new;
end;
$$;

create trigger sync_app_role_on_update
  after update of app_role on public.profiles
  for each row
  execute function public.sync_app_role_to_auth();

-- Also sync on insert (new user signs up)
create or replace function public.sync_app_role_on_signup()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  update auth.users
  set raw_app_meta_data =
    raw_app_meta_data || jsonb_build_object('app_role', coalesce(meta ->> 'app_role', 'civilian'))
  where id = new.id;
  return new;
end;
$$;

-- NOTE: The on_auth_user_created trigger already exists from initial_schema.
-- We modify the handle_new_user function instead.
-- ============================================================
-- 3. Update the handle_new_user trigger to set app_role
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  role_value text := coalesce(meta ->> 'role', 'Volunteer');
  app_role_value public.app_role := coalesce(
    (meta ->> 'app_role')::public.app_role,
    case
      when role_value = 'Volunteer' then 'civilian'::public.app_role
      when role_value = 'Disaster Coordinator' then 'admin'::public.app_role
      when role_value = 'Police' then 'coordinator'::public.app_role
      when role_value = 'Rescue Worker' then 'rescue_team'::public.app_role
      when role_value = 'Medical Staff' then 'ambulance_team'::public.app_role
      when role_value = 'Fire Department' then 'fire_response'::public.app_role
      else 'civilian'::public.app_role
    end
  );
begin
  insert into public.profiles (
    id,
    username,
    full_name,
    email,
    phone,
    organization,
    role,
    emergency_contact,
    app_role
  )
  values (
    new.id,
    coalesce(meta ->> 'username', split_part(new.email, '@', 1)),
    coalesce(meta ->> 'full_name', ''),
    new.email,
    nullif(meta ->> 'phone', ''),
    nullif(meta ->> 'organization', ''),
    role_value::public.worker_role,
    nullif(meta ->> 'emergency_contact', ''),
    app_role_value
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    organization = excluded.organization,
    role = excluded.role,
    emergency_contact = excluded.emergency_contact,
    app_role = excluded.app_role,
    updated_at = now();

  -- Sync app_role to auth.users raw_app_meta_data for JWT inclusion
  update auth.users
  set raw_app_meta_data =
    raw_app_meta_data || jsonb_build_object('app_role', app_role_value)
  where id = new.id;

  return new;
end;
$$;

-- ============================================================
-- 4. Index for fast role lookups
-- ============================================================
create index if not exists profiles_app_role_idx on public.profiles (app_role);

-- ============================================================
-- 5. Revoke/GRANT for the sync function (security definer)
-- ============================================================
revoke all on function public.sync_app_role_to_auth() from public;
revoke all on function public.sync_app_role_on_signup() from public;
