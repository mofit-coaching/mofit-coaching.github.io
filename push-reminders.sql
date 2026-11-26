-- =====================================================================
-- Mofit: WEB PUSH v2 - subscription renewal reminders.
-- Clients get a push exactly 3 days, 1 day, and on the day their sub_end
-- arrives; the coach gets one morning digest (expired / expiring <= 7d /
-- unpaid) that opens the new الاشتراكات tab (./?tab=subs).
--
-- No third party: pg_cron -> public.push_call -> send-push edge function
-- (web-push over VAPID), same pipeline as push.sql v1.
--
-- Run once in Supabase > SQL Editor, AFTER push.sql. Safe to re-run.
-- 08:00 UTC = 10:00 Cairo in winter (EET) / 11:00 in summer (EEST).
-- =====================================================================

do $$ begin perform cron.unschedule('subs-renewal-reminders'); exception when others then null; end $$;
select cron.schedule(
  'subs-renewal-reminders',
  '0 8 * * *',
  $$ select public.push_call(jsonb_build_object('kind', 'subs')) $$
);

-- manual test (coach): fire one run right now without waiting for 10:00
--   select public.push_call(jsonb_build_object('kind', 'subs'));
