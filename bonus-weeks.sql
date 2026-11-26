-- Mofit: gift / bonus weeks per client. NOT RUN YET - needs the coach OK first.
-- Only ADDS one column; existing rows get 0, no data is changed or lost.
-- The app adds profiles.bonus_weeks on top of the plan weeks (1 month = 4, 3 = 12, 6 = 26, 12 = 52).
alter table public.profiles
  add column if not exists bonus_weeks integer not null default 0 check (bonus_weeks >= 0);
