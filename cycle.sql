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

create or replace function public.set_my_sex(p_sex text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_sex not in ('ذكر','أنثى') then raise exception 'invalid value'; end if;
  update public.profiles set sex = p_sex where id = auth.uid();
end $$;
revoke all on function public.set_my_sex(text) from public, anon;
grant execute on function public.set_my_sex(text) to authenticated;
commit;
