-- Minerals on logged meals (meal_items): lets the client day view show
-- micronutrient totals for the foods they marked as eaten.
-- Mirrors the mineral columns already on diet_plan_items (same names/types).
-- Safe to re-run.

alter table public.meal_items
  add column if not exists sodium_mg double precision,
  add column if not exists potassium_mg double precision,
  add column if not exists magnesium_mg double precision,
  add column if not exists iron_mg double precision,
  add column if not exists calcium_mg double precision,
  add column if not exists zinc_mg double precision,
  add column if not exists fiber_g double precision;
