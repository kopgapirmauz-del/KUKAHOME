-- CRM production repair script
-- Run this whole file in Supabase SQL Editor

create extension if not exists pgcrypto;

-- 1) Storage bucket used by /api/db and /api/sales-check-file
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-private',
  'crm-private',
  false,
  null,
  array['application/json','application/pdf','image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;

-- 2) Vacancies table used by /api/vacancies
create table if not exists public.vacancies (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  phone text not null default '',
  position text not null default '',
  note text not null default '',
  resume_url text not null default '',
  resume_file_name text not null default '',
  photo_url text not null default '',
  source text not null default 'website_vacancy',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vacancies add column if not exists full_name text not null default '';
alter table public.vacancies add column if not exists phone text not null default '';
alter table public.vacancies add column if not exists position text not null default '';
alter table public.vacancies add column if not exists note text not null default '';
alter table public.vacancies add column if not exists resume_url text not null default '';
alter table public.vacancies add column if not exists resume_file_name text not null default '';
alter table public.vacancies add column if not exists photo_url text not null default '';
alter table public.vacancies add column if not exists source text not null default 'website_vacancy';
alter table public.vacancies add column if not exists status text not null default 'new';
alter table public.vacancies add column if not exists created_at timestamptz not null default now();
alter table public.vacancies add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_vacancies_created_at on public.vacancies(created_at desc);
create index if not exists idx_vacancies_status on public.vacancies(status);

-- 3) Warranty tickets table used by /api/warranty-tickets
create table if not exists public.warranty_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no integer not null,
  store_id text,
  manager_id text,
  sale_date date,
  warranty_start_date date,
  warranty_end_date date,
  ticket_url text not null default '',
  ticket_data_url text not null default '',
  ticket_file_name text not null default '',
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.warranty_tickets add column if not exists ticket_no integer;
alter table public.warranty_tickets add column if not exists store_id text;
alter table public.warranty_tickets add column if not exists manager_id text;
alter table public.warranty_tickets add column if not exists sale_date date;
alter table public.warranty_tickets add column if not exists warranty_start_date date;
alter table public.warranty_tickets add column if not exists warranty_end_date date;
alter table public.warranty_tickets add column if not exists ticket_url text not null default '';
alter table public.warranty_tickets add column if not exists ticket_data_url text not null default '';
alter table public.warranty_tickets add column if not exists ticket_file_name text not null default '';
alter table public.warranty_tickets add column if not exists form_data jsonb not null default '{}'::jsonb;
alter table public.warranty_tickets add column if not exists created_at timestamptz not null default now();
alter table public.warranty_tickets add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_warranty_tickets_created_at on public.warranty_tickets(created_at desc);

-- 4) Optional tables (for visibility in Table Editor)
create table if not exists public.sales_checks (
  id uuid primary key default gen_random_uuid(),
  check_no integer not null,
  store_id text,
  manager_id text,
  order_date date,
  form_data jsonb not null default '{}'::jsonb,
  receipt_url text not null default '',
  receipt_data_url text not null default '',
  receipt_file_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warehouse_orders (
  id uuid primary key default gen_random_uuid(),
  stage_key text not null default 'from_china',
  eta date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warehouse_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.warehouse_orders(id) on delete cascade,
  model text not null default '',
  info text not null default '',
  qty numeric not null default 0,
  status text not null default 'pending',
  image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warehouse_stock (
  id uuid primary key default gen_random_uuid(),
  model text not null default '',
  info text not null default '',
  qty numeric not null default 0,
  location_type text not null default 'showroom',
  store_id text,
  status text not null default 'available',
  reservation jsonb,
  image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Updated-at trigger for key tables
create or replace function public.crm_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vacancies_updated_at on public.vacancies;
create trigger trg_vacancies_updated_at
before update on public.vacancies
for each row
execute function public.crm_touch_updated_at();

drop trigger if exists trg_warranty_tickets_updated_at on public.warranty_tickets;
create trigger trg_warranty_tickets_updated_at
before update on public.warranty_tickets
for each row
execute function public.crm_touch_updated_at();

drop trigger if exists trg_sales_checks_updated_at on public.sales_checks;
create trigger trg_sales_checks_updated_at
before update on public.sales_checks
for each row
execute function public.crm_touch_updated_at();

drop trigger if exists trg_warehouse_orders_updated_at on public.warehouse_orders;
create trigger trg_warehouse_orders_updated_at
before update on public.warehouse_orders
for each row
execute function public.crm_touch_updated_at();

drop trigger if exists trg_warehouse_order_items_updated_at on public.warehouse_order_items;
create trigger trg_warehouse_order_items_updated_at
before update on public.warehouse_order_items
for each row
execute function public.crm_touch_updated_at();

drop trigger if exists trg_warehouse_stock_updated_at on public.warehouse_stock;
create trigger trg_warehouse_stock_updated_at
before update on public.warehouse_stock
for each row
execute function public.crm_touch_updated_at();

-- 6) Quick verify
select 'bucket' as kind, id as name from storage.buckets where id = 'crm-private'
union all
select 'table' as kind, table_name as name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'vacancies','warranty_tickets','sales_checks','warehouse_orders','warehouse_order_items','warehouse_stock'
  )
order by kind, name;
