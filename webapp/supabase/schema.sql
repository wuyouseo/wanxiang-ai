-- 万象 AI · 云同步数据库结构
-- 在 Supabase Dashboard -> SQL Editor 里新建一个 query，粘贴本文件全部内容，
-- 点击 Run 即可一次性建好表、索引、Row Level Security 策略和图片存储桶。
-- 可以安全地重复执行（用了 if not exists / drop policy if exists）。

-- ---------------------------------------------------------------------------
-- 1. 生成记录表：一行 = 一张图片或一段视频的"作品"
-- ---------------------------------------------------------------------------
create table if not exists public.history_items (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  favorite boolean not null default false,
  result_url text not null,
  result_kind text not null,
  params jsonb not null,
  prompt text not null
);

create index if not exists history_items_user_created_idx
  on public.history_items (user_id, created_at desc);

alter table public.history_items enable row level security;

drop policy if exists "history_items_select_own" on public.history_items;
create policy "history_items_select_own" on public.history_items
  for select using (auth.uid() = user_id);

drop policy if exists "history_items_insert_own" on public.history_items;
create policy "history_items_insert_own" on public.history_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "history_items_update_own" on public.history_items;
create policy "history_items_update_own" on public.history_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "history_items_delete_own" on public.history_items;
create policy "history_items_delete_own" on public.history_items
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Storage 桶：转存后的图片/视频文件（对抗生图服务商临时链接过期）
--    路径约定：<user_id>/<history_item_id>.<ext>，RLS 靠路径首段等于
--    auth.uid() 来判断"是不是自己的文件夹"。
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

drop policy if exists "artworks_public_read" on storage.objects;
create policy "artworks_public_read" on storage.objects
  for select using (bucket_id = 'artworks');

drop policy if exists "artworks_insert_own_folder" on storage.objects;
create policy "artworks_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artworks_update_own_folder" on storage.objects;
create policy "artworks_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artworks_delete_own_folder" on storage.objects;
create policy "artworks_delete_own_folder" on storage.objects
  for delete using (
    bucket_id = 'artworks' and (storage.foldername(name))[1] = auth.uid()::text
  );
