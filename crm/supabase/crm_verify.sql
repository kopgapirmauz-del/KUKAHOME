-- CRM + Warehouse + Sales + HR quick verification
-- Run in Supabase SQL Editor

-- 1) Core tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'stores','users','clients','notifications',
    'sales_checks','warehouse_orders','warehouse_order_items','warehouse_stock','media_files'
  )
order by table_name;

-- 2) Row counts
select 'stores' as table_name, count(*)::bigint as total from public.stores
union all select 'users', count(*) from public.users
union all select 'clients', count(*) from public.clients
union all select 'notifications', count(*) from public.notifications
union all select 'sales_checks', count(*) from public.sales_checks
union all select 'warehouse_orders', count(*) from public.warehouse_orders
union all select 'warehouse_order_items', count(*) from public.warehouse_order_items
union all select 'warehouse_stock', count(*) from public.warehouse_stock
union all select 'media_files', count(*) from public.media_files
order by table_name;

-- 3) Recent updates for profile/settings checks
select id, full_name, login, phone, role, updated_at
from public.users
order by updated_at desc nulls last
limit 30;

-- 4) Recent clients with currency support check
select id, date, manager, phone, price, currency, created_at
from public.clients
order by created_at desc nulls last
limit 30;

-- 5) Recent sales checks
select id, check_no, manager_id, store_id, created_at
from public.sales_checks
order by created_at desc nulls last
limit 30;

-- 6) Recent warehouse stock
select id, model, info, qty, location_type, store_id, status, updated_at
from public.warehouse_stock
order by updated_at desc nulls last
limit 30;
