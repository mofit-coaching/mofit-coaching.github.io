# Supabase security checklist (to confirm in the Supabase dashboard)

The app ships the public key, so RLS is the only thing between a user and other people's data.
I could not check any of this from the repo.

Tables used by the app: profiles, program_exercises, program_templates, set_logs, workout_sessions, body_logs, checkins, habits, health_screens, meal_items, diet_plan_items, diet_templates, foods, exercise_videos, client_supplements, client_events, coach_private, price_plans.
Also: RPC `search_foods`, storage bucket `checkins`, and the edge function behind coach actions (create/delete client).

1. Dashboard > Authentication > Policies: every table above shows "RLS enabled". None is "disabled" or "unrestricted".
2. Client tables (profiles, set_logs, workout_sessions, body_logs, checkins, habits, health_screens, meal_items, client_supplements, client_events): a client can only select/insert/update rows where the row's user id equals auth.uid(). The coach role can read all.
3. `profiles`: a client must NOT be able to update their own `role`, `active` or subscription fields (privilege escalation to coach). Check the UPDATE policy has a WITH CHECK that blocks role changes, or use column-level grants / a trigger.
4. `coach_private`: only the coach role can read/write. Clients get nothing.
5. `price_plans`: public read of active rows only; writes only by the coach.
6. `foods`, `exercise_videos`, templates: read for authenticated users; writes only by the coach.
7. Storage bucket `checkins` (progress photos): bucket is private (not public); policies limit read/upload to the owner's folder and the coach. The app uses signed URLs, so a private bucket works.
8. `search_foods` RPC: SECURITY INVOKER (or it respects RLS), not SECURITY DEFINER returning other users' data.
9. The coach edge function (delete_client, create user): verifies the caller is the coach from the JWT, not from a request field.
10. Auth settings: email signups disabled (clients are created by the coach) unless you add self sign-up on purpose; password minimum length 8+; leaked-password protection on if available.
11. Dashboard > Advisors > Security Advisor: run it and fix every ERROR it lists.

Quick test: log in as a test client, open the browser console and run `sb.from("profiles").select("*")`. It must return only that client's row. Then try `sb.from("profiles").update({role:"coach"}).eq("id", <own id>)`. It must fail.
