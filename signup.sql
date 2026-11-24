-- Mofit: public sign-up with coach approval.
-- Run once in Supabase > SQL Editor. Review first; it only touches users who sign up through the new form
-- (it checks raw_user_meta_data.signup = true), so accounts the coach creates are not affected.
-- ASSUMPTION to verify: public.profiles has columns id, full_name, email, phone, role, active, training_days.
-- If a column name differs, edit the INSERT below.

alter table public.profiles
  add column if not exists signup_days  text,
  add column if not exists signup_steps int,
  add column if not exists signup_plan  text;

create or replace function public.handle_signup_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'signup','') = 'true' then
    insert into public.profiles (id, full_name, email, phone, role, active, training_days, signup_days, signup_steps, signup_plan)
    values (
      new.id,
      left(coalesce(new.raw_user_meta_data->>'full_name',''), 80),
      new.email,
      left(coalesce(new.raw_user_meta_data->>'phone',''), 20),
      'client',          -- always client, never taken from user input
      false,             -- inactive until the coach approves
      least(greatest(coalesce((new.raw_user_meta_data->>'training_days')::int, 3),1),7),
      left(new.raw_user_meta_data->>'signup_days', 100),
      nullif(new.raw_user_meta_data->>'signup_steps','')::int,
      left(new.raw_user_meta_data->>'signup_plan', 80)
    )
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_signup_request on auth.users;
create trigger on_auth_user_signup_request
  after insert on auth.users
  for each row execute function public.handle_signup_request();

-- BEFORE enabling public sign-up, confirm in Supabase (see SECURITY-CHECKLIST.md items 2-3):
--  * a client can NOT update their own role or active columns (otherwise a new user could approve themselves)
--  * a pending (active=false) user can read only their own profile row (the app needs it to show "under review")
-- Then in Authentication > Providers > Email: enable sign-ups, keep "Confirm email" ON,
-- set Site URL to https://mofit-coaching.github.io and enable CAPTCHA/rate limits.
