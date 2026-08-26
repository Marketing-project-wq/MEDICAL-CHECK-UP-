-- Run once in Supabase SQL editor to create the storage bucket and policies

-- Create private bucket (no public access)
insert into storage.buckets (id, name, public)
values ('mcu-files', 'mcu-files', false)
on conflict (id) do nothing;

-- Service role (backend) can upload to any path
create policy "service_upload" on storage.objects
  for insert to service_role
  using (bucket_id = 'mcu-files');

-- Service role can read/delete any object (for signed URL generation and cleanup)
create policy "service_read" on storage.objects
  for select to service_role
  using (bucket_id = 'mcu-files');

create policy "service_delete" on storage.objects
  for delete to service_role
  using (bucket_id = 'mcu-files');
