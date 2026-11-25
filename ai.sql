-- Mofit: AI assistant ask log (client Q&A history + daily cap counting).
-- Run once in Supabase > SQL Editor. Safe to re-run.
-- Privacy: a client can read/write their own rows. The COACH has admin read
-- access (Mohammed's design, 2026-11-25): he can open any client's AI
-- conversation from the client card. Writes stay client-only; the edge
-- function writes with the service role.
-- Flagged questions ALSO surface as client_events kind='ai_flag'.

create table if not exists public.ai_asks (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  question   text not null check (char_length(question) between 1 and 300),
  answer     text not null check (char_length(answer) between 1 and 600),
  kind       text not null default 'ok' check (kind in ('ok','flag')),
  created_at timestamptz not null default now()
);
create index if not exists ai_asks_user_created_idx on public.ai_asks (user_id, created_at desc);

alter table public.ai_asks enable row level security;

-- coach check (same helper chat.sql defines; create-or-replace so ai.sql is self-contained)
create or replace function public.chat_is_coach() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach') $$;
-- only authenticated sessions may call it (RLS policies run as them)
revoke execute on function public.chat_is_coach() from public, anon;
grant execute on function public.chat_is_coach() to authenticated;

drop policy if exists ai_asks_select on public.ai_asks;
create policy ai_asks_select on public.ai_asks for select to authenticated
  using (user_id = auth.uid() or public.chat_is_coach());

-- no insert policy on purpose: clients never write ai_asks directly.
-- Only the ai-assist edge function writes, with the service role (bypasses RLS).
