-- Warranty tickets: production table + daily server cron cleanup
-- Run in Supabase SQL editor as project owner

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

create table if not exists public.warranty_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no integer not null,
  store_id bigint references public.stores(id) on delete set null,
  manager_id bigint references public.users(id) on delete set null,
  sale_date date,
  warranty_start_date date,
  warranty_end_date date,
  ticket_url text,
  ticket_data_url text,
  ticket_file_name text,
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_warranty_tickets_created_at on public.warranty_tickets(created_at desc);
create index if not exists idx_warranty_tickets_end_date on public.warranty_tickets(warranty_end_date);

create or replace function public.set_warranty_ticket_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_warranty_ticket_updated_at on public.warranty_tickets;
create trigger trg_warranty_ticket_updated_at
before update on public.warranty_tickets
for each row
execute function public.set_warranty_ticket_updated_at();

create or replace function public.cleanup_expired_warranty_tickets()
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  expired_count integer := 0;
  removed_files integer := 0;
begin
  with expired as (
    select id, ticket_file_name
    from public.warranty_tickets
    where warranty_end_date is not null
      and warranty_end_date < current_date
  ), removed_storage as (
    delete from storage.objects so
    using expired e
    where so.bucket_id = 'crm-private'
      and so.name = ('sales-checks/' || e.ticket_file_name)
    returning so.name
  ), removed_rows as (
    delete from public.warranty_tickets wt
    using expired e
    where wt.id = e.id
    returning wt.id
  )
  select
    (select count(*) from removed_rows),
    (select count(*) from removed_storage)
  into expired_count, removed_files;

  return jsonb_build_object(
    'deleted_tickets', coalesce(expired_count, 0),
    'deleted_files', coalesce(removed_files, 0),
    'run_at', now()
  );
end;
$$;

do $$
declare
  jid bigint;
begin
  select jobid into jid
  from cron.job
  where jobname = 'warranty_cleanup_daily'
  limit 1;

  if jid is not null then
    perform cron.unschedule(jid);
  end if;

  perform cron.schedule(
    'warranty_cleanup_daily',
    '15 0 * * *',
    $$select public.cleanup_expired_warranty_tickets();$$
  );
end;
$$;
