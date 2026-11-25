-- Mofit: 3-tier pricing (البرنامج / المتابعة / واحد لواحد VIP) × 4 مدد.
-- Run once in Supabase > SQL Editor. Replaces the old placeholder offers
-- (p1/p3/p6/p12, price null → "تواصل لمعرفة السعر") with the priced tier plans.
-- Monthly 300/500/1000 ج.م; commitment discount 10% (3 شهور) / 15% (6 شهور) / 25% (12 شهر).
-- old_price = monthly × months so the app shows "وفّر X%".
-- Note: the public prices tab reads price_plans when it has any rows, so this
-- delete+insert is what makes the new tiers live (PLAN_DEFAULTS is only a fallback).
delete from public.price_plans where id in ('p1','p3','p6','p12');
insert into public.price_plans (id, position, months, free_months, price, old_price, currency, badge, note, active) values
('b1',  0,  1,  0, 300,  null,  'ج.م', null,          null, true),
('b3',  1,  3,  0, 810,  900,   'ج.م', null,          null, true),
('b6',  2,  6,  0, 1530, 1800,  'ج.م', null,          null, true),
('b12', 3,  12, 0, 2700, 3600,  'ج.م', null,         null, true),
('s1',  4,  1,  0, 500,  null,  'ج.م', null,          null, true),
('s3',  5,  3,  0, 1350, 1500,  'ج.م', null,          null, true),
('s6',  6,  6,  0, 2550, 3000,  'ج.م', null,         null, true),
('s12', 7,  12, 0, 4500, 6000,  'ج.م', null,          null, true),
('v1',  8,  1,  0, 1000, null,  'ج.م', null,          null, true),
('v3',  9,  3,  0, 2700, 3000,  'ج.م', null,          null, true),
('v6',  10, 6,  0, 5100, 6000,  'ج.م', null,          null, true),
('v12', 11, 12, 0, 9000, 12000, 'ج.م', null,          null, true)
on conflict (id) do update set
  position=excluded.position, months=excluded.months, free_months=excluded.free_months,
  price=excluded.price, old_price=excluded.old_price, currency=excluded.currency,
  badge=excluded.badge, note=excluded.note, active=excluded.active;
