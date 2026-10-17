create extension if not exists pgcrypto;

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

create or replace function public.enforce_admin_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('gibcotech-admin-limit'));

    if (select count(*) from public.admin_users) >= 3 then
        raise exception 'Only three administrator accounts are allowed';
    end if;

    return new;
end;
$$;

drop trigger if exists admin_users_two_account_limit on public.admin_users;
drop trigger if exists admin_users_three_account_limit on public.admin_users;
create trigger admin_users_three_account_limit
before insert on public.admin_users
for each row execute function public.enforce_admin_limit();

revoke all on function public.enforce_admin_limit() from public, anon, authenticated;
drop function if exists public.enforce_two_admin_limit();

drop trigger if exists register_new_auth_user_as_admin on auth.users;
drop function if exists public.register_new_auth_user_as_admin();

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.admin_users
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to anon, authenticated;

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(trim(name)) between 1 and 120),
    category text not null check (char_length(trim(category)) between 1 and 60),
    price numeric(12, 2) not null check (price >= 0),
    description text not null default '',
    image_url text,
    created_at timestamptz not null default now()
);

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;

drop policy if exists "Products are visible to everyone" on public.products;
create policy "Products are visible to everyone"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products"
on public.products
for insert
to authenticated
with check ((select public.is_store_admin()));

drop policy if exists "Admins can edit products" on public.products;
create policy "Admins can edit products"
on public.products
for update
to authenticated
using ((select public.is_store_admin()))
with check ((select public.is_store_admin()));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using ((select public.is_store_admin()));

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.admin_users to authenticated;

insert into public.products (id, name, category, price, description, image_url)
values
    ('00000000-0000-4000-8000-000000000001', 'Hikvision CCTV Cameras', 'Security', 3500, '', 'images/hikvision-cctv.png'),
    ('00000000-0000-4000-8000-000000000002', 'Hikvision DVR Recorder', 'Security', 5500, '', 'images/hikvision-dvr.png'),
    ('00000000-0000-4000-8000-000000000003', 'CCTV Installation Services', 'Security', 5000, '', 'images/cctvinstallation-services.png'),
    ('00000000-0000-4000-8000-000000000004', '4K Smart TV Box', 'TV Accessories', 3500, '', 'images/tvbox.png'),
    ('00000000-0000-4000-8000-000000000005', 'HDMI Cables', 'TV Accessories', 800, '', 'images/hdmi-cables.png'),
    ('00000000-0000-4000-8000-000000000006', 'Wireless CCTV Camera', 'Security', 4500, '', 'images/wireless-cameras.png'),
    ('00000000-0000-4000-8000-000000000007', 'Computer Monitors', 'Computers', 8000, '', 'images/computer-monitors.png'),
    ('00000000-0000-4000-8000-000000000008', 'Laptop Charger', 'Accessories', 1000, '', 'images/laptop-charger.png'),
    ('00000000-0000-4000-8000-000000000009', 'Computer RAM', 'Accessories', 1500, '', 'images/computer-ram.png'),
    ('00000000-0000-4000-8000-000000000010', 'Solid State Drive (SSD)', 'Storage', 2500, '', 'images/ssd.png')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'product-images',
    'product-images',
    true,
    5242880,
    array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product photos are public" on storage.objects;
create policy "Product photos are public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product photos" on storage.objects;
create policy "Admins can upload product photos"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'product-images'
    and (select public.is_store_admin())
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins can update product photos" on storage.objects;
create policy "Admins can update product photos"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'product-images'
    and (select public.is_store_admin())
    and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
    bucket_id = 'product-images'
    and (select public.is_store_admin())
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins can delete product photos" on storage.objects;
create policy "Admins can delete product photos"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'product-images'
    and (select public.is_store_admin())
);
