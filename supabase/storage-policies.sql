-- Asecxel — Storage bucket & RLS policies for user-uploaded Excel/CSV files
-- Run after creating the "excel-files" bucket (private, no public access)
-- either via the Supabase dashboard or:
--   insert into storage.buckets (id, name, public) values ('excel-files', 'excel-files', false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'excel-files',
  'excel-files',
  false,
  10485760, -- 10 MB, enforced again server-side in the upload route
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-excel', -- .xls
    'text/csv',
    'application/csv'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Convention: object path is always `${auth.uid()}/${filename}`.
-- storage.foldername(name) splits the path into an array of folder segments,
-- so foldername(name)[1] is the top-level folder = the owning user's id.

create policy "excel-files: owner can read own objects"
  on storage.objects for select
  using (
    bucket_id = 'excel-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "excel-files: owner can upload into own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'excel-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "excel-files: owner can delete own objects"
  on storage.objects for delete
  using (
    bucket_id = 'excel-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- No public/update policy is created: files are immutable once uploaded and
-- are only ever served back via short-lived signed URLs generated server-side.
