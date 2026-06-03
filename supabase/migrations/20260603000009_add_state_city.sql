-- Add state and city columns for civilian registrations
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;

-- Update trigger to handle state/city metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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
begin
  insert into public.profiles (
    id, username, full_name, email, phone, organization,
    emergency_contact, app_role, city, state
  )
  values (
    new.id,
    coalesce(meta ->> 'username', split_part(new.email, '@', 1)),
    coalesce(meta ->> 'full_name', ''),
    new.email,
    nullif(meta ->> 'phone', ''),
    nullif(meta ->> 'organization', ''),
    nullif(meta ->> 'emergency_contact', ''),
    app_role_value,
    nullif(meta ->> 'city', ''),
    nullif(meta ->> 'state', '')
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    organization = excluded.organization,
    emergency_contact = excluded.emergency_contact,
    app_role = excluded.app_role,
    city = excluded.city,
    state = excluded.state,
    updated_at = now();

  update auth.users
  set raw_app_meta_data =
    raw_app_meta_data || jsonb_build_object('app_role', app_role_value)
  where id = new.id;

  return new;
end;
$$;
