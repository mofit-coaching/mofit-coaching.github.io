-- =====================================================================
-- Mofit: WEB PUSH v1 - subscriptions table + event triggers + daily cron.
-- Mohammed's spec (Nov 25): push notifications when the coach receives a
-- chat message, and for clients: league events, coach chat replies, and a
-- daily "missing today" nudge. Demo accounts only until Mohammed says go.
--
-- Run once in Supabase > SQL Editor, AFTER league-v3.sql. Safe to re-run.
-- Does NOT touch league_start or any league function: the league-start
-- push fan-out comes from a table trigger on league_config, which fires
-- only when the coach himself starts the league.
--
-- ONE MANUAL STEP at the bottom: store the service-role key in the Vault
-- and point push_settings at it (triggers stay silent until then).
-- =====================================================================

-- ---------- extensions ----------
-- If either statement errors with a permission error, enable the extension
-- once from Dashboard > Database > Extensions and re-run; both are
-- idempotent here.
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------- push_subscriptions: one row per device/browser ----------
create table if not exists public.push_subscriptions (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subs_select on public.push_subscriptions;
create policy push_subs_select on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists push_subs_insert on public.push_subscriptions;
create policy push_subs_insert on public.push_subscriptions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists push_subs_update on public.push_subscriptions;
create policy push_subs_update on public.push_subscriptions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_subs_delete on public.push_subscriptions;
create policy push_subs_delete on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.push_subscriptions from public, anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- ---------- push_settings: pointer to the service key in the Vault ----------
-- The table itself is deny-all (RLS on, no policies): only security definer
-- functions owned by postgres can read it. The service-role key itself
-- never lives in this table, only the Vault secret id.
create table if not exists public.push_settings (
  id     int primary key default 1 check (id = 1),
  key_id uuid,                -- vault secret id holding the service-role key
  fn_url text not null default 'https://bqxyyrmtufureewxneoe.supabase.co/functions/v1/send-push'
);
alter table public.push_settings enable row level security;  -- no policies = deny all
revoke all on public.push_settings from public, anon, authenticated;

-- ---------- internal caller: fire-and-forget POST to the edge function ----------
create or replace function public.push_call(payload jsonb) returns void
language plpgsql security definer set search_path = public as
$$
declare
  k text; u text;
begin
  select s.fn_url, v.decrypted_secret into u, k
    from public.push_settings s
    left join vault.decrypted_secrets v on v.id = s.key_id
   where s.id = 1;
  if k is null or u is null then return; end if;  -- not configured yet: stay silent
  perform net.http_post(
    url     := u,
    body    := payload,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'Authorization', 'Bearer ' || k)
  );
exception when others then
  return;  -- pushes are best-effort; never break the triggering action
end $$;

revoke all on function public.push_call(jsonb) from public, anon, authenticated;

-- ---------- trigger 1: chat message -> push the other side ----------
-- client writes -> coach gets pushed; coach writes -> that client gets pushed.
create or replace function public.push_on_message() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  perform public.push_call(jsonb_build_object(
    'kind',      'chat',
    'client_id', new.client_id,
    'sender',    new.sender_role,
    'preview',   left(new.body, 80)
  ));
  return new;
end $$;

drop trigger if exists push_on_message on public.messages;
create trigger push_on_message
  after insert on public.messages
  for each row execute function public.push_on_message();

-- ---------- trigger 2: league start -> fan out to every active client ----------
-- league_config.season only changes when the coach runs league_start.
create or replace function public.push_on_league_start() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if new.season is distinct from old.season and new.started_at is not null then
    perform public.push_call(jsonb_build_object('kind', 'league_started', 'season', new.season));
  end if;
  return new;
end $$;

drop trigger if exists push_on_league_start on public.league_config;
create trigger push_on_league_start
  after update on public.league_config
  for each row execute function public.push_on_league_start();

-- ---------- trigger 3 (cron): daily "missing today" nudge ----------
-- 17:00 UTC = 19:00 Cairo in winter (EET) / 20:00 in summer (EEST).
-- The edge function computes who is joined and has no activity today.
do $$ begin perform cron.unschedule('league-daily-nudge'); exception when others then null; end $$;
select cron.schedule(
  'league-daily-nudge',
  '0 17 * * *',
  $$ select public.push_call(jsonb_build_object('kind', 'nudge')) $$
);

-- =====================================================================
-- MANUAL STEP (identity): store the service-role key in the Vault once,
-- then point push_settings at it. Until this runs, triggers stay silent
-- (push_call returns without sending).
--
--   select vault.create_secret('PASTE_SERVICE_ROLE_KEY_HERE', 'push_service_key');
--   -- copy the returned uuid, then:
--   insert into public.push_settings (id, key_id)
--   values (1, 'PASTE_VAULT_UUID_HERE')
--   on conflict (id) do update set key_id = excluded.key_id;
-- =====================================================================
