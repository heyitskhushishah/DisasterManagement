-- Function to auto-confirm a user's email right after registration
-- Restricted to users created within the last minute to prevent abuse
create or replace function public.confirm_user_email(user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set email_confirmed_at = now()
  where id = user_id
    and email_confirmed_at is null
    and created_at > now() - interval '1 minute';

  if not found then
    raise exception 'User not found, already confirmed, or registration window expired';
  end if;
end;
$$;
