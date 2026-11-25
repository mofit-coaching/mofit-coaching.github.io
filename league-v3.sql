-- =====================================================================
-- Mofit: WEEKLY LEAGUE v3 - coach-configurable league days + manual prizes.
-- Mohammed's spec (Nov 25): the coach decides the league days (which
-- weekday the league week starts on; default Sunday-to-Saturday) and
-- writes the prizes himself (text for 1st / 2nd / 3rd), shown to
-- participants on the league tab and in the invite.
--
-- Run once in Supabase > SQL Editor, AFTER league.sql (v1) and
-- league-v2.sql. Safe to re-run. league_start is NOT touched here.
-- =====================================================================

-- ---------- schema changes ----------
alter table public.league_config
  add column if not exists week_start_day int  not null default 0,  -- 0=Sunday .. 6=Saturday (extract(dow))
  add column if not exists prize_1        text not null default '',
  add column if not exists prize_2        text not null default '',
  add column if not exists prize_3        text not null default '';

alter table public.league_config
  drop constraint if exists league_config_week_start_day_check;
alter table public.league_config
  add constraint league_config_week_start_day_check check (week_start_day between 0 and 6);

-- ---------- coach: update settings (mode / league days / prizes) ----------
-- drop the v1 two-arg overload first so RPC calls stay unambiguous
drop function if exists public.league_set_config(text, text);
create or replace function public.league_set_config(
  p_mode           text default null,
  p_note           text default null,
  p_week_start_day int  default null,
  p_prize_1        text default null,
  p_prize_2        text default null,
  p_prize_3        text default null
) returns jsonb
language plpgsql security definer set search_path = public as
$$
begin
  if not public.league_is_coach() then raise exception 'forbidden'; end if;
  if p_week_start_day is not null and (p_week_start_day < 0 or p_week_start_day > 6) then
    raise exception 'week_start_day must be 0..6';
  end if;
  update public.league_config set
    reward_mode    = coalesce(p_mode,           reward_mode),
    reward_note    = coalesce(p_note,           reward_note),
    week_start_day = coalesce(p_week_start_day, week_start_day),
    prize_1        = coalesce(p_prize_1,        prize_1),
    prize_2        = coalesce(p_prize_2,        prize_2),
    prize_3        = coalesce(p_prize_3,        prize_3),
    updated_at     = now()
  where id = 1;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- board v3: league week follows the configured start day ----------
create or replace function public.league_board() returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  me_id   uuid := auth.uid();
  coach   boolean;
  cfg     public.league_config%rowtype;
  d       date;
  ws      date;        -- current league week start (configured weekday, Cairo)
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

  if cfg.started_at is null then
    return jsonb_build_object('started', false, 'is_coach', coach);
  end if;

  d   := (now() at time zone 'Africa/Cairo')::date;
  ws  := d - ((extract(dow from d)::int - cfg.week_start_day + 7) % 7);
  lws := ws - 7;
  base := greatest(ws, (cfg.started_at at time zone 'Africa/Cairo')::date);

  perform public.league_gen_nickname(p.id)
    from public.profiles p
    where p.role = 'client' and p.active
      and not exists (select 1 from public.league_nicknames n where n.client_id = p.id);
  select nickname into me_nick from public.league_nicknames where client_id = me_id;
  select status into my_stat from public.league_optins where client_id = me_id and season = cfg.season;
  select count(*) into n_joined from public.league_optins where season = cfg.season and status = 'joined';

  -- close the previous league week once: crown the podium (top 3 members)
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
        and (cfg.started_at at time zone 'Africa/Cairo')::date < lws + 7
    ) t
    where t.rn <= 3 and t.points > 0
    on conflict (week_start, rank) do nothing;
  end if;

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

  select jsonb_agg(jsonb_build_object(
           'week_start', w.week_start,
           'nickname', w.nickname,
           'points', w.points,
           'rank', w.rank
         ) order by w.week_start desc, w.rank)
    into podium
  from public.league_winners w
  where w.season = cfg.season;

  -- only participants (and the coach) may see the board, podium and trophies
  if not coach and coalesce(my_stat, 'none') <> 'joined' then
    rows   := null;
    win    := null;
    podium := null;
  end if;

  return jsonb_build_object(
    'started',        true,
    'is_coach',       coach,
    'season',         cfg.season,
    'started_at',     cfg.started_at,
    'week_start',     ws,
    'ends_at',        ws + 7,
    'base_date',      base,
    'week_start_day', cfg.week_start_day,
    'tz',             'Africa/Cairo',
    'rows',           coalesce(rows, '[]'::jsonb),
    'podium',         win,
    'trophies',       coalesce(podium, '[]'::jsonb),
    'reward_mode',    coalesce(cfg.reward_mode, 'manual'),
    'reward_note',    cfg.reward_note,
    'prize_1',        cfg.prize_1,
    'prize_2',        cfg.prize_2,
    'prize_3',        cfg.prize_3,
    'members',        n_joined,
    'me',             jsonb_build_object('nickname', me_nick, 'status', coalesce(my_stat, 'none'))
  );
end $$;

-- ---------- function privileges: authenticated users only ----------
revoke all on function public.league_set_config(text, text, integer, text, text, text) from public, anon;
revoke all on function public.league_board() from public, anon;
grant execute on function public.league_set_config(text, text, integer, text, text, text) to authenticated;
grant execute on function public.league_board() to authenticated;
