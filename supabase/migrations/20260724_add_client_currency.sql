begin;

alter table public.clients
  add column if not exists currency text;

update public.clients
set currency = case
  when upper(trim(coalesce(currency, ''))) = 'USD' then 'USD'
  else 'UZS'
end;

alter table public.clients
  alter column currency set default 'UZS',
  alter column currency set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_currency_check'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_currency_check
      check (currency in ('UZS', 'USD'));
  end if;
end
$$;

commit;
