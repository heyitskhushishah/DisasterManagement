-- Clean app_role enum to 5 roles + safe handle_new_user

-- 1. Drop functions referencing the app_role type
drop function if exists public.sync_app_role_to_auth() cascade;
drop function if exists public.sync_app_role_on_signup() cascade;
drop function if exists public.handle_new_user() cascade;

-- 2. Map existing admin/volunteer_coordinator to new values
update public.profiles
  set app_role = 'coordinator'::text::public.app_role
  where app_role = 'admin'::text::public.app_role;

update public.profiles
  set app_role = 'civilian'::text::public.app_role
  where app_role = 'volunteer_coordinator'::text::public.app_role;

-- 3. Create new 5-value enum
create type public.app_role_new as enum (
  'civilian',
  'coordinator',
  'rescue_team',
  'ambulance_team',
  'fire_response'
);

-- 4. Drop old default, migrate column, re-add default
alter table public.profiles
  alter column app_role drop default;

alter table public.profiles
  alter column app_role type public.app_role_new
  using (app_role::text::public.app_role_new);

alter table public.profiles
  alter column app_role set default 'civilian'::public.app_role_new;

-- 5. Drop old type, rename new
drop type public.app_role;
alter type public.app_role_new rename to app_role;

-- 6. Recreate handle_new_user with safe worker_role cast
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  app_role_value public.app_role := coalesce(
    (meta ->> 'app_role')::public.app_role,
    case
      when meta ->> 'role' = 'civilian' then 'civilian'::public.app_role
      when meta ->> 'role' = 'coordinator' then 'coordinator'::public.app_role
      when meta ->> 'role' = 'rescue_team' then 'rescue_team'::public.app_role
      when meta ->> 'role' = 'ambulance_team' then 'ambulance_team'::public.app_role
      when meta ->> 'role' = 'fire_response' then 'fire_response'::public.app_role
      else 'civilian'::public.app_role
    end
  );
  worker_role_value public.worker_role;
begin
  -- Safe cast: only attempt cast for known worker_role enum values
  worker_role_value := case meta ->> 'role'
    when 'Rescue Worker' then 'Rescue Worker'::public.worker_role
    when 'Medical Staff' then 'Medical Staff'::public.worker_role
    when 'Volunteer' then 'Volunteer'::public.worker_role
    when 'Fire Department' then 'Fire Department'::public.worker_role
    when 'Police' then 'Police'::public.worker_role
    when 'Disaster Coordinator' then 'Disaster Coordinator'::public.worker_role
    else 'Volunteer'::public.worker_role
  end;

  insert into public.profiles (
    id, username, full_name, email, phone, organization,
    role, emergency_contact, app_role
  )
  values (
    new.id,
    coalesce(meta ->> 'username', split_part(new.email, '@', 1)),
    coalesce(meta ->> 'full_name', ''),
    new.email,
    nullif(meta ->> 'phone', ''),
    nullif(meta ->> 'organization', ''),
    worker_role_value,
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

  -- Sync app_role to JWT
  update auth.users
  set raw_app_meta_data =
    raw_app_meta_data || jsonb_build_object('app_role', app_role_value)
  where id = new.id;

  return new;
end;
$$;

-- 7. Recreate on_auth_user_created trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 8. Recreate sync_app_role_to_auth
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

-- 9. Update is_responder to use app_role
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
      and app_role is distinct from 'civilian'
  );
$$;

-- 10. Update comment
comment on column public.profiles.app_role is 'Application-level role for RBAC: civilian, coordinator, rescue_team, ambulance_team, fire_response';

-- 11. Index
create index if not exists profiles_app_role_idx on public.profiles (app_role);

-- 12. Revoke
revoke all on function public.sync_app_role_to_auth() from public;
do $$
begin
  if exists (select 1 from pg_proc where proname = 'sync_app_role_on_signup') then
    revoke all on function public.sync_app_role_on_signup() from public;
  end if;
end;
$$;
