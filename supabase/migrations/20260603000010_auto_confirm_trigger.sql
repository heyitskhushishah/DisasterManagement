-- Auto-confirm email for every new user at the database level
create or replace function public.auto_confirm_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_confirm_email_trigger on auth.users;

create trigger auto_confirm_email_trigger
  before insert on auth.users
  for each row
  execute function public.auto_confirm_email();
