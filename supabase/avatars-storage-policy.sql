-- Asecxel — Storage bucket & RLS policies for user profile photos.
-- Public bucket (unlike excel-files): an avatar is meant to be visible
-- wherever the user shows up in the UI, so it is served directly via its
-- public URL instead of a short-lived signed URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB, enforced again client-side before upload
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = true;

-- Convention: object path is always `${auth.uid()}/avatar.${ext}`, same
-- owner-folder pattern as excel-files.

create policy "avatars: anyone can view"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: owner can upload into own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: owner can replace own objects"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: owner can delete own objects"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

grant select, insert, update, delete on storage.objects to authenticated;
