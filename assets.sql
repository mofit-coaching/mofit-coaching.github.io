-- Coach landing photo: public "assets" bucket, coach-only writes.
-- The login landing (logged-out visitors) reads the coach photo from this bucket
-- at a fixed path (coach/photo.jpg); only the coach can upload/change/delete it.
-- Safe to re-run: everything is idempotent.

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

create or replace function public.assets_is_coach() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach') $$;
revoke execute on function public.assets_is_coach() from public, anon;
grant execute on function public.assets_is_coach() to authenticated;

drop policy if exists assets_public_read on storage.objects;
create policy assets_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'assets');

drop policy if exists assets_coach_insert on storage.objects;
create policy assets_coach_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'assets' and public.assets_is_coach());

drop policy if exists assets_coach_update on storage.objects;
create policy assets_coach_update on storage.objects for update to authenticated
  using (bucket_id = 'assets' and public.assets_is_coach());

drop policy if exists assets_coach_delete on storage.objects;
create policy assets_coach_delete on storage.objects for delete to authenticated
  using (bucket_id = 'assets' and public.assets_is_coach());
