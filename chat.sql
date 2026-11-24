-- Mofit: in-app chat between coach and client.
-- Run once in Supabase > SQL Editor. Safe to re-run.
-- ASSUMPTION to verify: public.profiles has columns id, role ('coach' or 'client') and active (boolean).

create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  sender_id  uuid not null default auth.uid(),
  sender_role text not null check (sender_role in ('client','coach')),
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists messages_client_created_idx on public.messages (client_id, created_at desc);

-- helpers (security definer so the policies do not depend on profiles RLS)
create or replace function public.chat_is_coach() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach') $$;

create or replace function public.chat_is_active() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and active) $$;

alter table public.messages enable row level security;

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (client_id = auth.uid() or public.chat_is_coach());

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid() and public.chat_is_active() and (
      (sender_role = 'client' and client_id = auth.uid())
      or (sender_role = 'coach' and public.chat_is_coach())
    )
  );

-- marking as read: only the read_at column can be changed, and only within your own thread
drop policy if exists messages_update_read on public.messages;
create policy messages_update_read on public.messages for update to authenticated
  using (client_id = auth.uid() or public.chat_is_coach())
  with check (client_id = auth.uid() or public.chat_is_coach());
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- live updates
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
