-- Mofit: client referral mechanic (combined: v1 columns+trigger, v2.1 function).
-- Run once in Supabase > SQL Editor. Review first; it only ADDS columns and functions.
-- 1) profiles.signup_src: keeps the referral code from the signup link (?src=...)
--    (signup.js already sends it in auth metadata; the trigger just never copied it)
-- 2) profiles.reward_granted: coach-controlled marker that the referrer's free week
--    was actually given for this referred signup
-- 3) handle_signup_request(): copies signup_src from auth metadata into profiles
-- 4) my_referrals(): a client sees ONLY name / masked phone / status of signups tagged
--    with THEIR PROFILE ID as the referral code (existing clients have no phone on
--    file, so the code is the id, matched against auth.uid()). Security definer;
--    NO profiles RLS change. Execute granted to authenticated only.
-- v2.1: created_at is selected with `at time zone 'utc'` - profiles.created_at is
--    timestamp without time zone; without the cast the function fails with
--    "structure of query does not match function result type".
-- ASSUMPTION (same as signup.sql): profiles has id, phone, full_name, active, created_at.

alter table public.profiles
  add column if not exists signup_src text,
  add column if not exists reward_granted boolean not null default false;

create or replace function public.handle_signup_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'signup','') = 'true' then
    insert into public.profiles (id, full_name, email, phone, role, active, training_days, signup_days, signup_steps, signup_plan, signup_src)
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
      left(new.raw_user_meta_data->>'signup_plan', 80),
      nullif(left(coalesce(new.raw_user_meta_data->>'signup_src',''), 40), '')
    )
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

create or replace function public.my_referrals()
returns table (full_name text, phone text, active boolean, reward_granted boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select p.full_name,
           case when coalesce(p.phone,'')='' then ''
                else left(p.phone,3) || repeat('•', greatest(length(p.phone)-6,0)) || right(p.phone,3) end,
           p.active, p.reward_granted, (p.created_at at time zone 'utc')
    from public.profiles p
    where p.signup_src = auth.uid()::text
    order by p.created_at desc;
end $$;

revoke all on function public.my_referrals() from public, anon;
grant execute on function public.my_referrals() to authenticated;

