-- Mofit: حسابات المساعدين (assistant staff accounts) — الخطوة الأولى.
-- Run once in Supabase > SQL Editor. Safe to re-run.
--
-- This ONLY widens the role check so a profile can be an "assistant".
-- Default deny stays: no existing policy grants an assistant anything beyond
-- what any logged-in visitor can read (their own profile, foods, videos, plans).
-- Assistants get NO client data, chat, approvals, prices, or coach tools.
-- Each future assistant job gets its own small migration that opens exactly
-- that capability, verified with test accounts before it ships.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('coach','client','assistant'));
