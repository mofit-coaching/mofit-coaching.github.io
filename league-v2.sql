-- =====================================================================
-- Mofit: WEEKLY LEAGUE v2 — coach-started, opt-in, trophies for top 3.
-- Mohammed's spec (Nov 25): the coach STARTS the league with a button;
-- starting resets the baseline (only activity after the start counts);
-- every active client gets an in-app invite and chooses to participate
-- or not; only participants appear on the board and see the league tab;
-- the weekly podium is the top 3 (gold/silver/bronze), kept as history.
--
-- Run once in Supabase > SQL Editor, AFTER league.sql (v1). Safe to re-run.
-- Assumes v1 objects exist: league_nicknames, league_winners, league_config,
-- league_is_coach(), league_gen_nickname(), league_points(), league_board(),
-- league_set_config(), league_grant_reward().
-- =====================================================================

-- ---------- schema changes ----------
alter table public.league_config
  add column if not exists started_at timestamptz,
  add column if not exists season     int not null default 1;

alter table public.league_winners
  add column if not exists rank int not null default 1,
  add column if not exists season int not null default 1;
-- one podium row per client per week.
-- Drop the old unique CONSTRAINT first (its backing index goes with it);
-- dropping the index first fails because it backs the constraint.
alter table public.league_winners drop constraint if exists league_winners_week_start_key;
drop index if exists league_winners_week_start_key;
create unique index if not exists league_winners_week_rank_idx on public.league_winners (week_start, rank);

create table if not exists public.league_optins (
  client_id  uuid not null references public.profiles(id) on delete cascade,
  season     int  not null,
  status     text not null default 'pending' check (status in ('pending','joined','declined')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (client_id, season)
);

-- ---------- coach: start (or restart) the league ----------
-- Sets the baseline to NOW: only activity logged after this moment counts.
-- Every active client gets a fresh 'pending' invite for the new season.
create or replace function public.league_start() returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  s int;
begin
  if not public.league_is_coach() then raise exception 'forbidden'; end if;
  update public.league_config
     set season = season + 1, started_at = now(), updated_at = now()
   where id = 1
   returning season into s;
  insert into public.league_optins (client_id, season, status)
  select p.id, s, 'pending'
  from public.profiles p
  where p.role = 'client' and p.active
  on conflict (client_id, season) do nothing;
  return jsonb_build_object('ok', true, 'season', s);
end $$;

-- ---------- client: answer the invite ----------
create or replace function public.league_respond(p_join boolean) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  me_id uuid := auth.uid();
  s     int;
begin
  if me_id is null then return jsonb_build_object('error','not_authenticated'); end if;
  select season into s from public.league_config where id = 1;
  if s is null then return jsonb_build_object('error','not_started'); end if;
  update public.league_optins
     set status = case when p_join then 'joined' else 'declined' end,
         decided_at = now()
   where client_id = me_id and season = s and status = 'pending';
  if not found then
    -- late joiner who was not on the original invite list
    insert into public.league_optins (client_id, season, status, decided_at)
    values (me_id, s, case when p_join then 'joined' else 'declined' end, now())
    on conflict (client_id, season) do update
      set status = excluded.status, decided_at = excluded.decided_at;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- board v2: members only, baseline from the league start ----------
create or replace function public.league_board() returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  me_id   uuid := auth.uid();
  coach   boolean;
  cfg     public.league_config%rowtype;
  ws      date;        -- current calendar week (Mon, Cairo)
  lws     date;
  base    date;        -- scoring lower bound = max(week start, league start)
  rows    jsonb;
  win     jsonb;
  podium  jsonb;
  me_nick text;
  my_stat text;
  n_joined int;
begin
  if me_id is null then return jsonb_build_object('error','not_authenticated'); end if;
  coach := public.league_is_coach();
  select * into cfg from public.league_config where id = 1;

  -- league not started yet: clients see nothing, the coach gets the start state
  if cfg.started_at is null then
    return jsonb_build_object('started', false, 'is_coach', coach);
  end if;

  ws  := (now() at time zone 'Africa/Cairo')::date
         - (extract(isodow from (now() at time zone 'Africa/Cairo')::date)::int - 1);
  lws := ws - 7;
  base := greatest(ws, (cfg.started_at at time zone 'Africa/Cairo')::date);

  -- every active client gets a nickname (identity stays hidden from other clients)
  perform public.league_gen_nickname(p.id)
    from public.profiles p
    where p.role = 'client' and p.active
      and not exists (select 1 from public.league_nicknames n where n.client_id = p.id);
  select nickname into me_nick from public.league_nicknames where client_id = me_id;
  select status into my_stat from public.league_optins where client_id = me_id and season = cfg.season;
  select count(*) into n_joined from public.league_optins where season = cfg.season and status = 'joined';

  -- close the previous week once: crown the podium (top 3 members) after Monday
  if not exists (select 1 from public.league_winners where week_start = lws and season = cfg.season) then
    insert into public.league_winners (week_start, client_id, nickname, points, workouts, rank, season)
    select lws, t.client_id, t.nickname, t.points, t.workouts, t.rn, cfg.season
    from (
      select n.client_id, n.nickname, p.points, p.workouts, p.habit_days,
             row_number() over (order by p.points desc, p.workouts desc, p.habit_days desc, n.client_id) as rn
      from public.league_optins o
      join public.profiles pr on pr.id = o.client_id and pr.active and pr.role = 'client'
      join public.league_nicknames n on n.client_id = o.client_id
      cross join lateral public.league_points(o.client_id, lws) p
      where o.season = cfg.season and o.status = 'joined'
        and (cfg.started_at at time zone 'Africa/Cairo')::date < lws + 7  -- week overlaps the league window
    ) t
    where t.rn <= 3 and t.points > 0
    on conflict (week_start, rank) do nothing;
  end if;

  -- current standings: joined members only
  select jsonb_agg(x.obj order by x.ord) into rows from (
    select row_number() over (order by p.points desc, p.workouts desc, p.habit_days desc, n.nickname) as ord,
           jsonb_build_object(
             'nickname',   n.nickname,
             'points',     p.points,
             'workouts',   p.workouts,
             'habit_days', p.habit_days,
             'checkins',   p.checkins,
             'streak',     p.streak,
             'me',         n.client_id = me_id,
             'client_id',  case when coach then n.client_id else null end
           ) as obj
    from public.league_optins o
    join public.profiles pr on pr.id = o.client_id and pr.active and pr.role = 'client'
    join public.league_nicknames n on n.client_id = o.client_id
    cross join lateral public.league_points(o.client_id, base) p
    where o.season = cfg.season and o.status = 'joined'
  ) x;

  -- latest podium (top 3 of the most recent closed week)
  select jsonb_agg(jsonb_build_object(
           'winner_id', w.id,
           'week_start', w.week_start,
           'nickname', w.nickname,
           'points', w.points,
           'workouts', w.workouts,
           'rank', w.rank,
           'reward_granted', w.reward_granted_at is not null,
           'client_id', case when coach then w.client_id else null end
         ) order by w.rank)
    into win
  from public.league_winners w
  where w.week_start = (select max(week_start) from public.league_winners where season = cfg.season)
    and w.season = cfg.season;

  -- trophy room: every closed week of this season, oldest last
  select jsonb_agg(jsonb_build_object(
           'week_start', w.week_start,
           'nickname', w.nickname,
           'points', w.points,
           'rank', w.rank
         ) order by w.week_start desc, w.rank)
    into podium
  from public.league_winners w
  where w.season = cfg.season;

  -- only participants (and the coach) may see the board, podium and trophies.
  -- pending / declined / non-invited callers get empty data.
  if not coach and coalesce(my_stat, 'none') <> 'joined' then
    rows   := null;
    win    := null;
    podium := null;
  end if;

  return jsonb_build_object(
    'started',     true,
    'is_coach',    coach,
    'season',      cfg.season,
    'started_at',  cfg.started_at,
    'week_start',  ws,
    'ends_at',     ws + 7,
    'base_date',   base,
    'tz',          'Africa/Cairo',
    'rows',        coalesce(rows, '[]'::jsonb),
    'podium',      win,
    'trophies',    coalesce(podium, '[]'::jsonb),
    'reward_mode', coalesce(cfg.reward_mode, 'manual'),
    'reward_note', cfg.reward_note,
    'members',     n_joined,
    'me',          jsonb_build_object('nickname', me_nick, 'status', coalesce(my_stat, 'none'))
  );
end $$;

-- ---------- function privileges: authenticated users only, never anon ----------
revoke execute on function public.league_start() from anon;
revoke execute on function public.league_respond(boolean) from anon;
grant execute on function public.league_start() to authenticated;
grant execute on function public.league_respond(boolean) to authenticated;

-- ---------- row level security ----------
alter table public.league_optins enable row level security;
-- a client reads only their own invite; the coach reads all
drop policy if exists lg_opt_select on public.league_optins;
create policy lg_opt_select on public.league_optins for select to authenticated
  using (client_id = auth.uid() or public.league_is_coach());
revoke insert, update, delete on public.league_optins from authenticated;
