-- MOFIT assistant assignments (PR2)
-- The coach assigns clients to assistants. An assistant gets READ-ONLY access
-- to an assigned client's profile, check-ins and messages. Nothing else.
-- Deactivation or unassignment removes access immediately (server-side).
-- Apply in the Supabase SQL editor. Idempotent.

-- helper: current user is an active assistant (security definer, same idiom as is_coach)
create or replace function public.is_active_assistant() returns boolean
  language sql stable security definer set search_path=public as
$$ select exists (select 1 from public.profiles where id=auth.uid() and role='assistant' and active) $$;

grant execute on function public.is_active_assistant() to authenticated;

-- assignments table
create table if not exists public.assistant_assignments (
  assistant_id uuid not null references public.profiles(id) on delete cascade,
  client_id    uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (assistant_id, client_id)
);
alter table public.assistant_assignments enable row level security;
grant select, insert, delete on public.assistant_assignments to authenticated;

-- coach manages assignments; an assistant can list its own
drop policy if exists assistant_assignments_coach on public.assistant_assignments;
create policy assistant_assignments_coach on public.assistant_assignments
  for all to authenticated using (public.is_coach()) with check (public.is_coach());
drop policy if exists assistant_assignments_own on public.assistant_assignments;
create policy assistant_assignments_own on public.assistant_assignments
  for select to authenticated using (assistant_id = auth.uid() and public.is_active_assistant());

-- read-only access to assigned clients (view only: no insert/update/delete policies)
drop policy if exists profiles_assistant_read on public.profiles;
create policy profiles_assistant_read on public.profiles
  for select to authenticated using (
    public.is_active_assistant()
    and exists (select 1 from public.assistant_assignments a
                where a.assistant_id = auth.uid() and a.client_id = profiles.id));

drop policy if exists checkins_assistant_read on public.checkins;
create policy checkins_assistant_read on public.checkins
  for select to authenticated using (
    public.is_active_assistant()
    and exists (select 1 from public.assistant_assignments a
                where a.assistant_id = auth.uid() and a.client_id = checkins.client_id));

drop policy if exists messages_assistant_read on public.messages;
create policy messages_assistant_read on public.messages
  for select to authenticated using (
    public.is_active_assistant()
    and exists (select 1 from public.assistant_assignments a
                where a.assistant_id = auth.uid() and a.client_id = messages.client_id));
