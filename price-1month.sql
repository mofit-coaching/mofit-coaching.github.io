-- Mofit: add the 1-month offer next to the 3, 6 and 12-month offers.
-- Run once in Supabase > SQL Editor. Safe to re-run (never overwrites an existing row).
-- PRICE IS A PLACEHOLDER (null): the offer shows "تواصل لمعرفة السعر" until the coach
-- sets the price from the app (clients page > "الأسعار والعروض") and taps save.
insert into public.price_plans (id, position, months, free_months, price, old_price, currency, badge, note, active)
values ('p1', 0, 1, 0, null, null, 'ج.م', null, null, true)
on conflict (id) do nothing;
