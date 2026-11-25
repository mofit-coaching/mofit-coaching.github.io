-- =====================================================================
-- Mofit: WEEKLY LEAGUE (الليج الأسبوعي)
-- Clients compete each calendar week (Monday-Sunday, Africa/Cairo) on
-- workouts, habit check-ins and weekly check-ins. Clients see each other
-- ONLY through auto-generated fun nicknames: real names, emails and
-- photos are never exposed to other clients ( Mohammed's requirement ).
-- The winner is crowned lazily: the first league_board() call after the
-- week closes finalizes the previous week. Reward is granted by the
-- coach from the app; the reward mode is a config value Mohammed picks
-- before launch (default: 'manual' = coach grants it himself).
-- Run once in Supabase > SQL Editor. Safe to re-run.
-- ASSUMPTIONS to verify (edit if a name differs):
--   public.profiles(id uuid, role text 'coach'|'client', active boolean)
--   public.workout_sessions(client_id uuid, log_date date)
--   public.habits(client_id uuid, log_date date)
--   public.checkins(client_id uuid, checkin_date date)
-- =====================================================================

create table if not exists public.league_nicknames (
  client_id  uuid primary key references public.profiles(id) on delete cascade,
  nickname   text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.league_winners (
  id                bigint generated always as identity primary key,
  week_start        date not null unique,
  client_id         uuid not null references public.profiles(id) on delete cascade,
  nickname          text not null,
  points            int  not null,
  workouts          int  not null default 0,
  reward_granted_at timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.league_config (
  id          smallint primary key default 1 check (id = 1),
  reward_mode text not null default 'manual'
              check (reward_mode in ('manual','free_week','plan_upgrade')),
  reward_note text,
  updated_at  timestamptz not null default now()
);
insert into public.league_config (id) values (1) on conflict (id) do nothing;

-- ---------- helpers (security definer so they do not depend on profiles RLS) ----------
create or replace function public.league_is_coach() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach') $$;

-- Fun Arabic nickname generator: deterministic per client, retries with a
-- numeric suffix on the (unlikely) collision. Inserts and returns the name.
create or replace function public.league_gen_nickname(cid uuid) returns text
language plpgsql volatile security definer set search_path = public as
$$
declare
  adj  text[] := array['جامد','ناري','حديدي','متوحش','سريع','عنيد',
                       'خارق','أسطوري','ذهبي','شرس','صلب','ملكي'];
  noun text[] := array['أسد الجيم','نمر الحديد','صقر الأوزان','ذئب البار',
                       'وحش الدنابل','تنين السكوات','فهد الكارديو','ثور البنش',
                       'مارد الكابلات','سهم البروتين','جوكر التمارين','بطل اللياقة'];
  k    int := 0;
  cand text;
begin
  loop
    cand := adj [1 + abs(hashtext(cid::text || ':' || k || ':a')) % array_length(adj,1)]
         || ' ' ||
            noun[1 + abs(hashtext(cid::text || ':' || k || ':b')) % array_length(noun,1)];
    if k > 0 then cand := cand || ' ' || (k + 1); end if;
    begin
      insert into public.league_nicknames (client_id, nickname) values (cid, cand);
      return cand;
    exception when unique_violation then
      k := k + 1;
      if k > 40 then
        cand := 'لاعب ' || upper(substr(replace(cid::text,'-',''),1,4));
        insert into public.league_nicknames (client_id, nickname)
          values (cid, cand) on conflict (client_id) do nothing;
        return cand;
      end if;
    end;
  end loop;
end $$;

-- Points for one client in one Mon-Sun week:
--   workout logged ......... 10 pts each
--   habit check-in day ..... 4 pts each (max 7 days)
--   weekly check-in sent ... 15 pts
--   streak bonus ........... 5 pts per consecutive completed week with 3+ workouts
create or replace function public.league_points(cid uuid, ws date)
returns table(points int, workouts int, habit_days int, checkins int, streak int)
language plpgsql stable security definer set search_path = public as
$$
declare
  w int; h int; c int; s int := 0; wk date := ws - 7; cnt int;
begin
  select count(*) into w from public.workout_sessions
    where client_id = cid and log_date >= ws and log_date < ws + 7;
  select count(*) into h from public.habits
    where client_id = cid and log_date >= ws and log_date < ws + 7;
  select count(*) into c from public.checkins
    where client_id = cid and checkin_date >= ws and checkin_date < ws + 7;
  loop
    select count(*) into cnt from public.workout_sessions
      where client_id = cid and log_date >= wk and log_date < wk + 7;
    exit when cnt < 3 or s >= 260;
    s := s + 1; wk := wk - 7;
  end loop;
  return query select (w*10 + least(h,7)*4 + c*15 + s*5), w, least(h,7), c, s;
end $$;

-- ---------- main board RPC: one call returns everything the app needs ----------
-- Clients get nicknames + numbers only (client_id is NULL for them).
-- The coach additionally gets client_id so he can match real names.
create or replace function public.league_board() returns jsonb
language plpgsql security definer set search_path = public as
$$
declare
  me_id   uuid := auth.uid();
  coach   boolean;
  ws      date;
  lws     date;
  rows    jsonb;
  win     jsonb;
  cfg     public.league_config%rowtype;
  me_nick text;
begin
  if me_id is null then return jsonb_build_object('error','not_authenticated'); end if;
  coach := public.league_is_coach();
  ws  := (now() at time zone 'Africa/Cairo')::date
         - (extract(isodow from (now() at time zone 'Africa/Cairo')::date)::int - 1);
  lws := ws - 7;

  -- every active client gets a nickname (identity stays hidden from other clients)
  perform public.league_gen_nickname(p.id)
    from public.profiles p
    where p.role = 'client' and p.active
      and not exists (select 1 from public.league_nicknames n where n.client_id = p.id);
  select nickname into me_nick from public.league_nicknames where client_id = me_id;

  -- close the previous week once: crown the winner on the first board call after Monday
  if not exists (select 1 from public.league_winners where week_start = lws) then
    insert into public.league_winners (week_start, client_id, nickname, points, workouts)
    select lws, t.client_id, t.nickname, t.points, t.workouts
    from (
      select n.client_id, n.nickname, p.points, p.workouts, p.habit_days,
             row_number() over (order by p.points desc, p.workouts desc, p.habit_days desc, n.client_id) as rn
      from public.league_nicknames n
      join public.profiles pr on pr.id = n.client_id and pr.active and pr.role = 'client'
      cross join lateral public.league_points(n.client_id, lws) p
    ) t
    where t.rn = 1 and t.points > 0
    on conflict (week_start) do nothing;
  end if;

  -- current-week standings
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
    from public.league_nicknames n
    join public.profiles pr on pr.id = n.client_id and pr.active and pr.role = 'client'
    cross join lateral public.league_points(n.client_id, ws) p
  ) x;

  -- latest crowned winner
  select jsonb_build_object(
           'winner_id', w.id,
           'week_start', w.week_start,
           'nickname', w.nickname,
           'points', w.points,
           'workouts', w.workouts,
           'reward_granted', w.reward_granted_at is not null,
           'client_id', case when coach then w.client_id else null end
         )
    into win
  from public.league_winners w
  order by w.week_start desc limit 1;

  select * into cfg from public.league_config where id = 1;

  return jsonb_build_object(
    'week_start',  ws,
    'ends_at',     ws + 7,
    'tz',          'Africa/Cairo',
    'rows',        coalesce(rows, '[]'::jsonb),
    'winner',      win,
    'reward_mode', coalesce(cfg.reward_mode, 'manual'),
    'reward_note', cfg.reward_note,
    'me',          jsonb_build_object('nickname', me_nick)
  );
end $$;

-- ---------- coach-only actions ----------
create or replace function public.league_set_config(p_mode text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as
$$
begin
  if not public.league_is_coach() then raise exception 'forbidden'; end if;
  if p_mode not in ('manual','free_week','plan_upgrade') then raise exception 'bad_mode'; end if;
  insert into public.league_config (id, reward_mode, reward_note)
  values (1, p_mode, left(coalesce(p_note,''), 120))
  on conflict (id) do update
    set reward_mode = excluded.reward_mode,
        reward_note = excluded.reward_note,
        updated_at  = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.league_grant_reward(p_winner_id bigint) returns jsonb
language plpgsql security definer set search_path = public as
$$
begin
  if not public.league_is_coach() then raise exception 'forbidden'; end if;
  update public.league_winners set reward_granted_at = now() where id = p_winner_id;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- row level security ----------
alter table public.league_nicknames enable row level security;
alter table public.league_winners   enable row level security;
alter table public.league_config    enable row level security;

-- nicknames: a client reads only their own row; the coach reads all.
-- everyone else reads the board through league_board(), which returns nicknames only.
drop policy if exists lg_nick_select on public.league_nicknames;
create policy lg_nick_select on public.league_nicknames for select to authenticated
  using (client_id = auth.uid() or public.league_is_coach());

-- winners: coach reads the table directly; clients get it through league_board()
-- (nickname + points only, never client_id).
drop policy if exists lg_win_select on public.league_winners;
create policy lg_win_select on public.league_winners for select to authenticated
  using (public.league_is_coach());

-- config: any logged-in user can read the reward text; writes go through
-- league_set_config (coach-only).
drop policy if exists lg_cfg_select on public.league_config;
create policy lg_cfg_select on public.league_config for select to authenticated
  using (true);

-- no direct writes: all mutations go through the security-definer RPCs above
revoke insert, update, delete on public.league_nicknames from authenticated;
revoke insert, update, delete on public.league_winners   from authenticated;
revoke insert, update, delete on public.league_config    from authenticated;
