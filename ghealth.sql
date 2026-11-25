-- Mofit: Google Health connection per client (auto steps sync into habits).
-- Run once in Supabase > SQL Editor. Safe to re-run.
-- Privacy: a client reads ONLY their own row (to render the connected state).
-- No insert/update/delete from the client: all writes go through the
-- health-sync edge function with the service role.

create table if not exists public.health_connections (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  provider      text not null default 'google',
  google_sub    text,
  refresh_token text not null,
  scope         text,
  connected_at  timestamptz not null default now(),
  last_sync_at  timestamptz
);

alter table public.health_connections enable row level security;

drop policy if exists health_connections_select on public.health_connections;
create policy health_connections_select on public.health_connections for select to authenticated
  using (user_id = auth.uid());

revoke all on table public.health_connections from public, anon;
grant select on table public.health_connections to authenticated;
-- deliberately no insert/update/delete grants: service role only.

-- Optional scheduler (identity: adjust secret + uncomment):
-- select cron.schedule('health-sync-daily', '55 21,23 * * *', $$
--   select net.http_post(
--     url := 'https://bqxyyrmtufureewxneoe.supabase.co/functions/v1/health-sync',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--     body := '{"action":"sync"}'::jsonb);
-- $$);
