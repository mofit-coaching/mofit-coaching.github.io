begin;
create table if not exists public.cycle_logs (
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  kind text not null check (kind in ('period','pms')),
  created_at timestamptz not null default now(),
  primary key (client_id, log_date)
);
alter table public.cycle_logs enable row level security;
drop policy if exists cycle_own on public.cycle_logs;
drop policy if exists cycle_coach_read on public.cycle_logs;
create policy cycle_own on public.cycle_logs for all to authenticated using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy cycle_coach_read on public.cycle_logs for select to authenticated using (public.is_coach());
revoke all on public.cycle_logs from public, anon;
grant select, insert, update, delete on public.cycle_logs to authenticated;

drop function if exists public.set_my_sex(text);
commit;
