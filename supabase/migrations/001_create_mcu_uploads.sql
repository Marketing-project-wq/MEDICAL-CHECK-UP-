-- MCU file upload records (members only — guest uploads have no DB record)
create table if not exists mcu_uploads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  mime_type   text not null,
  file_size   bigint not null,
  label       text,
  uploaded_at timestamptz not null default now()
);

-- Each user can only see their own rows
alter table mcu_uploads enable row level security;

create policy "owner_select" on mcu_uploads
  for select using (auth.uid() = user_id);

create policy "owner_insert" on mcu_uploads
  for insert with check (auth.uid() = user_id);

create policy "owner_delete" on mcu_uploads
  for delete using (auth.uid() = user_id);

create index on mcu_uploads (user_id, uploaded_at desc);
