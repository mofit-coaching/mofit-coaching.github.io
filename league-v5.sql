-- =====================================================================
-- Mofit: WEEKLY LEAGUE v5 - coach "end" and "cancel" buttons.
-- Mohammed's request (Nov 26, Arabic): one button to end the league NOW
-- and crown the winners from the current standings, and one to cancel
-- the league completely (no winners).
--
--   league_end(true)  - crowns the podium for the in-progress week from
--                       the live per-member standings, then ends the
--                       league. The previous week is closed first if the
--                       lazy Monday crown has not run yet.
--   league_end(false) - ends the league immediately; the in-progress
--                       week is discarded, no winners.
-- Either way the league turns off: clients lose the tab, the coach gets
-- the start card back (with the latest podium shown), and a later
-- league_start() begins a fresh season with new invites.
--
-- Run once in Supabase > SQL Editor, AFTER league.sql (v1),
-- league-v2.sql, league-v3.sql and league-v4.sql. Safe to re-run.
-- =====================================================================

create or replace function public.league_end(p_crown boolean default false) returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  cfg  public.league_config%rowtype;
  d    date;
  ws   date;
  lws  date;
  base date;
  n    int := 0;
begin
  if not public.league_is_coach() then raise exception 'forbidden'; end if;
  select * into cfg from public.league_config where id = 1;
  if cfg.started_at is null then
    return jsonb_build_object('ok', true, 'already_ended', true);
  end if;

  d    := (now() at time zone 'Africa/Cairo')::date;
  ws   := d - ((extract(dow from d)::int - cfg.week_start_day + 7) % 7);
  lws  := ws - 7;
  base := greatest(ws, (cfg.started_at at time zone 'Africa/Cairo')::date);

  -- close the previous week first if the lazy crown has not run yet
  if not exists (select 1 from public.league_winners where week_start = lws and season = cfg.season) then
    insert into public.league_winners (week_start, client_id, nickname, points, workouts, rank, season)
    select lws, t.client_id, t.nickname, t.points, t.workouts, t.rn, cfg.season
    from (
      select n.client_id, n.nickname, p.points, p.workouts, p.habit_days,
             row_number() over (order by p.points desc, p.workouts desc, p.habit_days desc, n.client_id) as rn
      from public.league_optins o
      join public.profiles pr on pr.id = o.client_id and pr.active and pr.role = 'client'
      join public.league_nicknames n on n.client_id = o.client_id
      cross join lateral (
        select greatest(lws,
                        (cfg.started_at at time zone 'Africa/Cairo')::date,
                        coalesce((o.decided_at at time zone 'Africa/Cairo')::date, lws)) as js
      ) j
      cross join lateral public.league_points_scoped(o.client_id, j.js, j.js) p
      where o.season = cfg.season and o.status = 'joined'
        and j.js < lws + 7
    ) t
    where t.rn <= 3 and t.points > 0
    on conflict (week_start, rank) do nothing;
  end if;

  -- crown the in-progress week from the live standings (per-member windows)
  if p_crown then
    insert into public.league_winners (week_start, client_id, nickname, points, workouts, rank, season)
    select ws, t.client_id, t.nickname, t.points, t.workouts, t.rn, cfg.season
    from (
      select n.client_id, n.nickname, p.points, p.workouts, p.habit_days,
             row_number() over (order by p.points desc, p.workouts desc, p.habit_days desc, n.client_id) as rn
      from public.league_optins o
      join public.profiles pr on pr.id = o.client_id and pr.active and pr.role = 'client'
      join public.league_nicknames n on n.client_id = o.client_id
      cross join lateral (
        select greatest(base, coalesce((o.decided_at at time zone 'Africa/Cairo')::date, base)) as js
      ) j
      cross join lateral public.league_points_scoped(o.client_id, j.js, j.js) p
      where o.season = cfg.season and o.status = 'joined'
    ) t
    where t.rn <= 3 and t.points > 0
    on conflict (week_start, rank) do nothing;
    get diagnostics n = row_count;
  end if;

  update public.league_config set started_at = null, updated_at = now() where id = 1;
  return jsonb_build_object('ok', true, 'crowned', p_crown, 'crowned_count', n);
end $$;

revoke all on function public.league_end(boolean) from public, anon;
grant execute on function public.league_end(boolean) to authenticated;

-- ---------- board v5: the ended state still answers the coach ----------
-- When the league is off, the coach start card now also gets the latest
-- podium (any season) plus the config fields its settings UI reads.
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
  base    date;        -- league-wide scoring lower bound = max(week start, league start)
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
    if coach then
      select jsonb_agg(jsonb_build_object(
               'winner_id', w.id,
               'week_start', w.week_start,
               'nickname', w.nickname,
               'points', w.points,
               'workouts', w.workouts,
               'rank', w.rank,
               'reward_granted', w.reward_granted_at is not null,
               'client_id', w.client_id
             ) order by w.rank)
        into win
      from public.league_winners w
      where w.week_start = (select max(week_start) from public.league_winners);
    end if;
    return jsonb_build_object(
      'started',        false,
      'is_coach',       coach,
      'season',         cfg.season,
      'last_podium',    win,
      'last_week',      (select max(week_start) from public.league_winners),
      'reward_mode',    coalesce(cfg.reward_mode, 'manual'),
      'reward_note',    cfg.reward_note,
      'week_start_day', cfg.week_start_day,
      'prize_1',        cfg.prize_1,
      'prize_2',        cfg.prize_2,
      'prize_3',        cfg.prize_3
    );
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

  -- close the previous league week once: crown the podium (top 3 members).
  -- a member's closed-week window also starts at their own join day;
  -- members who joined after the week ended are skipped.
  if not exists (select 1 from public.league_winners where week_start = lws and season = cfg.season) then
    insert into public.league_winners (week_start, client_id, nickname, points, workouts, rank, season)
    select lws, t.client_id, t.nickname, t.points, t.workouts, t.rn, cfg.season
    from (
      select n.client_id, n.nickname, p.points, p.workouts, p.habit_days,
             row_number() over (order by p.points desc, p.workouts desc, p.habit_days desc, n.client_id) as rn
      from public.league_optins o
      join public.profiles pr on pr.id = o.client_id and pr.active and pr.role = 'client'
      join public.league_nicknames n on n.client_id = o.client_id
      cross join lateral (
        select greatest(lws,
                        (cfg.started_at at time zone 'Africa/Cairo')::date,
                        coalesce((o.decided_at at time zone 'Africa/Cairo')::date, lws)) as js
      ) j
      cross join lateral public.league_points_scoped(o.client_id, j.js, j.js) p
      where o.season = cfg.season and o.status = 'joined'
        and j.js < lws + 7  -- league started and member joined before the week ended
    ) t
    where t.rn <= 3 and t.points > 0
    on conflict (week_start, rank) do nothing;
  end if;

  -- current standings: joined members only, each from their own join day
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
    cross join lateral (
      select greatest(base, coalesce((o.decided_at at time zone 'Africa/Cairo')::date, base)) as js
    ) j
    cross join lateral public.league_points_scoped(o.client_id, j.js, j.js) p
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

revoke all on function public.league_board() from public, anon;
grant execute on function public.league_board() to authenticated;
