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
  worker_role_value public.worker_role;
begin
  worker_role_value := case meta ->> 'role'
    -- Map from new app_role values (sent by the registration form)
    when 'civilian' then 'Volunteer'::public.worker_role
    when 'coordinator' then 'Disaster Coordinator'::public.worker_role
    when 'rescue_team' then 'Rescue Worker'::public.worker_role
    when 'ambulance_team' then 'Medical Staff'::public.worker_role
    when 'fire_response' then 'Fire Department'::public.worker_role
    -- Also handle direct worker_role values (legacy / admin)
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

  update auth.users
  set raw_app_meta_data =
    raw_app_meta_data || jsonb_build_object('app_role', app_role_value)
  where id = new.id;

  return new;
end;
$$;
