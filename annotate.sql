-- Mofit: coach video annotation (drawing) on posing check-in videos.
-- Run once in Supabase > SQL Editor. Safe to re-run.
-- Stores vector drawings (lines, angles, circles, text) per video as JSON.
-- The video file itself is untouched and stays in the private "posing" bucket.
-- ASSUMPTION to verify: public.posing_checkins has columns id and client_id (it does; the app writes them).

-- checkin_id must match the real type of posing_checkins.id (uuid or bigint), detected automatically:
do $$
declare t text;
begin
  select data_type into t
  from information_schema.columns
  where table_schema = 'public' and table_name = 'posing_checkins' and column_name = 'id';
  if t is null then
    raise exception 'posing_checkins.id not found';
  end if;
  execute format(
    'create table if not exists public.posing_annotations (
       id         bigint generated always as identity primary key,
       checkin_id %s not null references public.posing_checkins(id) on delete cascade,
       client_id  uuid not null references public.profiles(id) on delete cascade,
       moments    jsonb not null default ''[]''::jsonb,
       created_at timestamptz not null default now(),
       updated_at timestamptz not null default now()
     )', t);
end $$;

create unique index if not exists posing_annotations_checkin_uidx on public.posing_annotations (checkin_id);
create index if not exists posing_annotations_client_idx on public.posing_annotations (client_id);

alter table public.posing_annotations enable row level security;

-- read: the client sees their own analysis; the coach sees all
drop policy if exists posing_ann_select on public.posing_annotations;
create policy posing_ann_select on public.posing_annotations for select to authenticated
  using (client_id = auth.uid() or public.chat_is_coach());

-- write: coach only
drop policy if exists posing_ann_insert on public.posing_annotations;
create policy posing_ann_insert on public.posing_annotations for insert to authenticated
  with check (public.chat_is_coach());

drop policy if exists posing_ann_update on public.posing_annotations;
create policy posing_ann_update on public.posing_annotations for update to authenticated
  using (public.chat_is_coach()) with check (public.chat_is_coach());

drop policy if exists posing_ann_delete on public.posing_annotations;
create policy posing_ann_delete on public.posing_annotations for delete to authenticated
  using (public.chat_is_coach());
