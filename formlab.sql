-- MOFIT Form Lab: form scan results (metrics only, never video).
-- Run once in Supabase > SQL Editor. Safe to re-run. Additive only.
-- Privacy: a client reads/writes their own rows; the coach reads everything
-- and can mark one row per lift as the "ghost" (is_ghost). Ghost rows are
-- readable by every client so they can compare against the coach's ideal.
-- Rows are small JSON metrics (~2KB) — no video or photos are stored here.

create table if not exists public.form_scans (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  lift       text not null check (lift in ('squat','deadlift','bench','ohp')),
  score      int  not null check (score between 0 and 100),
  reps       int  not null default 0,
  metrics    jsonb not null default '{}'::jsonb,
  is_ghost   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists form_scans_client_idx on public.form_scans (client_id, created_at desc);
create index if not exists form_scans_ghost_idx on public.form_scans (lift) where is_ghost;

alter table public.form_scans enable row level security;

-- coach check (same helper chat.sql defines; create-or-replace so this file is self-contained)
create or replace function public.chat_is_coach() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach') $$;
revoke execute on function public.chat_is_coach() from public, anon;
grant execute on function public.chat_is_coach() to authenticated;

drop policy if exists form_scans_select on public.form_scans;
create policy form_scans_select on public.form_scans for select to authenticated
  using (client_id = auth.uid() or is_ghost or public.chat_is_coach());

drop policy if exists form_scans_insert on public.form_scans;
create policy form_scans_insert on public.form_scans for insert to authenticated
  with check (client_id = auth.uid() or public.chat_is_coach());

-- only the coach marks/unmarks ghosts (and can fix a row); clients never update
drop policy if exists form_scans_update on public.form_scans;
create policy form_scans_update on public.form_scans for update to authenticated
  using (public.chat_is_coach()) with check (public.chat_is_coach());

drop policy if exists form_scans_delete on public.form_scans;
create policy form_scans_delete on public.form_scans for delete to authenticated
  using (client_id = auth.uid() or public.chat_is_coach());
