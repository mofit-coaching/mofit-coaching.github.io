-- Mofit: Program Builder — atomic draft apply + recoverable archive.
-- Run once in Supabase > SQL Editor BEFORE merging the Program Builder PR.
-- Review first; it only ADDS a table and functions, and grants execute to
-- authenticated (coach-only inside the functions).
--
-- Why: applying a program draft used to be delete-then-insert from the browser.
-- A failed insert left the client with NO program. Now one security-definer
-- function does archive -> delete -> insert -> profile update in a single
-- transaction: any failure rolls everything back, so the old program stays.
-- The prior program AND its logged sets are copied into program_archive first,
-- so a draft can be undone with restore_program_archive().
--
-- ASSUMPTIONS (same style as signup.sql):
--   public.profiles(id uuid, role text 'coach'|'client', training_days int,
--     split_key text, split_name text, level text, goal text,
--     program_started_at timestamptz, deload_weeks jsonb,
--     manual_kcal numeric, protein_gpk numeric)
--   public.program_exercises(id uuid pk default gen_random_uuid(), client_id uuid,
--     day_no int, position int, day_label text, name text, sets int,
--     target_reps text, target_rir text, rest_sec int, tempo text, notes text,
--     video_url text)
--   public.set_logs(id uuid pk default gen_random_uuid(), client_id uuid,
--     exercise_id uuid, ...)
--   public.league_is_coach() exists (league.sql). If this project drops league,
--     replace the body with: exists (select 1 from public.profiles where id =
--     auth.uid() and role = 'coach')

create table if not exists public.program_archive (
  id          bigint generated always as identity primary key,
  client_id   uuid not null,
  archived_at timestamptz not null default now(),
  reason      text,
  exercises   jsonb not null,   -- full program_exercises rows as they were
  set_logs    jsonb not null    -- full set_logs rows for that client as they were
);

alter table public.program_archive enable row level security;

-- Coaches can read archives (to pick one to restore). No direct writes:
-- rows are created only by the security-definer functions below.
drop policy if exists "coach reads program archive" on public.program_archive;
create policy "coach reads program archive" on public.program_archive
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'coach'));

-- Apply a Program Builder draft atomically.
-- p_rows:    jsonb array of exercise rows (as built by planRows() in the app)
-- p_profile: jsonb with training_days, split_key, split_name, level, goal,
--            program_started_at, deload_weeks (null = leave profiles alone)
-- p_food:    jsonb with manual_kcal, protein_gpk (null = leave food targets alone)
create or replace function public.apply_program_draft(
  p_client_id uuid,
  p_rows      jsonb,
  p_profile   jsonb default null,
  p_food      jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old  jsonb;
  v_logs jsonb;
  v_n    int;
begin
  if not public.league_is_coach() then raise exception 'forbidden'; end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'empty program rows';
  end if;

  -- 1) archive the current program + its set history (same transaction)
  select coalesce(jsonb_agg(to_jsonb(pe)), '[]'::jsonb) into v_old
    from public.program_exercises pe where pe.client_id = p_client_id;
  if v_old <> '[]'::jsonb then
    select coalesce(jsonb_agg(to_jsonb(sl)), '[]'::jsonb) into v_logs
      from public.set_logs sl where sl.client_id = p_client_id;
    insert into public.program_archive (client_id, reason, exercises, set_logs)
    values (p_client_id, 'program-builder-draft', v_old, v_logs);
  end if;

  -- 2) replace the program
  delete from public.program_exercises where client_id = p_client_id;
  insert into public.program_exercises
    (client_id, day_no, position, day_label, name, sets,
     target_reps, target_rir, rest_sec, tempo, notes, video_url)
  select
    p_client_id,
    (r->>'day_no')::int,
    (r->>'position')::int,
    r->>'day_label',
    r->>'name',
    coalesce((r->>'sets')::int, 3),
    r->>'target_reps',
    r->>'target_rir',
    (r->>'rest_sec')::int,
    r->>'tempo',
    r->>'notes',
    r->>'video_url'
  from jsonb_array_elements(p_rows) r;
  get diagnostics v_n = row_count;

  -- 3) profile fields (optional)
  if p_profile is not null then
    update public.profiles set
      training_days      = (p_profile->>'training_days')::int,
      split_key          = p_profile->>'split_key',
      split_name         = p_profile->>'split_name',
      level              = p_profile->>'level',
      goal               = p_profile->>'goal',
      program_started_at = (p_profile->>'program_started_at')::timestamptz,
      deload_weeks       = coalesce(p_profile->'deload_weeks', '[]'::jsonb)
    where id = p_client_id;
  end if;

  -- 4) food targets (optional)
  if p_food is not null then
    update public.profiles set
      manual_kcal = (p_food->>'manual_kcal')::numeric,
      protein_gpk = (p_food->>'protein_gpk')::numeric
    where id = p_client_id;
  end if;

  return jsonb_build_object('inserted', v_n, 'archived', v_old <> '[]'::jsonb);
end $$;

-- Undo: put an archived program (and any of its set logs that are missing) back.
-- Replaces the client's CURRENT program with the archived one, keeping the
-- original row ids so logged sets point at their exercises again.
create or replace function public.restore_program_archive(p_archive_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_arch public.program_archive%rowtype;
  v_n    int;
begin
  if not public.league_is_coach() then raise exception 'forbidden'; end if;
  select * into v_arch from public.program_archive where id = p_archive_id;
  if not found then raise exception 'archive not found'; end if;

  delete from public.program_exercises where client_id = v_arch.client_id;
  insert into public.program_exercises
    select * from jsonb_populate_recordset(null::public.program_exercises, v_arch.exercises);
  get diagnostics v_n = row_count;

  insert into public.set_logs
    select * from jsonb_populate_recordset(null::public.set_logs, v_arch.set_logs)
    on conflict (id) do nothing;

  return jsonb_build_object('restored', v_n, 'client_id', v_arch.client_id);
end $$;

grant execute on function public.apply_program_draft(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.restore_program_archive(bigint) to authenticated;
