-- Phase C: iPhone Shortcut steps ingest.
-- Per-client code that may ONLY write that client's own steps. Run after ghealth.sql.

alter table public.profiles
  add column if not exists steps_code text;

create unique index if not exists profiles_steps_code_key on public.profiles(steps_code) where steps_code is not null;

-- Codes are minted lazily by the health-sync function (service role); no client-side write needed.
-- clients can already read their own profile row under the existing profiles RLS.
