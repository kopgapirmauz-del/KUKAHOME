-- ===========================================================================
-- Ma'lumotlarni eski KUKAHOME loyihasidan yangisiga ko'chirish.
--
-- QAYERDA ISHGA TUSHIRILADI:
--   YANGI loyihaning SQL Editor'ida (KUKAHOME-CRM / upmzdnvscezcrbcthxyy).
--
-- OLDIN: schema allaqachon ko'chirilgan bo'lishi kerak
--   (supabase/migrations/20260826_full_schema_baseline.sql).
--
-- NIMA UCHUN SHU YO'L: eski loyihaning HTTP API'si kvota tugagani uchun 402
-- qaytaryapti, lekin Postgres'ning o'zi ishlayapti. dblink to'g'ridan-to'g'ri
-- baza-bazaga ulanadi, ya'ni bloklangan API'ga umuman tegmaydi.
--
-- PAROL: quyidagi <ESKI_BAZA_PAROLI> o'rniga eski loyihaning database parolini
-- qo'ying. Uni bu yerdan olasiz:
--   Dashboard -> KUKAHOME -> Settings -> Database -> Database password
--   (esdan chiqqan bo'lsa "Reset database password" bosing)
--
-- XAVFSIZLIK: ko'chirish tugagach eski loyihaning parolini almashtiring -
-- u shu SQL matnida qolib ketadi.
-- ===========================================================================

do $$
declare
  -- IPv6 ishlamasa, pooler manzilini ishlating (Dashboard -> Connect):
  --   host=aws-0-ap-southeast-2.pooler.supabase.com port=5432
  --   user=postgres.qrhthaszfntilvcgsxez
  v_conn text := 'host=db.qrhthaszfntilvcgsxez.supabase.co port=5432 '
              || 'dbname=postgres user=postgres sslmode=require '
              || 'password=<ESKI_BAZA_PAROLI>';
  v_table text;
  v_rows bigint;
  v_total bigint := 0;
begin
  perform extensions.dblink_connect('src', v_conn);

  -- Tartib muhim: foreign key'lar tufayli ota-jadvallar avval ko'chadi.
  foreach v_table in array array[
    'stores',
    'users',
    'clients',
    'notifications',
    'attendance',
    'social_channels',
    'conversations',
    'messages',
    'meta_ad_accounts',
    'meta_ad_leads',
    'sales_checks',
    'warehouse_orders',
    'warehouse_order_items',
    'warehouse_stock',
    'warranty_tickets',
    'vacancies',
    'price_labels',
    'media_files'
  ]
  loop
    -- json_populate_recordset ustun ro'yxatini o'zi aniqlaydi, shuning uchun
    -- har bir jadval uchun alohida SQL yozish shart emas; enum va jsonb
    -- ustunlar ham to'g'ri o'giriladi.
    -- "on conflict do nothing" skriptni qayta ishga tushirsa bo'ladigan qiladi.
    execute format(
      'insert into public.%I select * from json_populate_recordset(null::public.%I, '
      || '(select j::json from extensions.dblink(''src'', %L) as x(j text))) '
      || 'on conflict do nothing',
      v_table, v_table,
      format('select coalesce(json_agg(q), ''[]''::json)::text from public.%I q', v_table)
    );
    get diagnostics v_rows = row_count;
    v_total := v_total + v_rows;
    raise notice '% -> % qator', v_table, v_rows;
  end loop;

  perform extensions.dblink_disconnect('src');
  raise notice 'JAMI: % qator ko''chirildi', v_total;
end
$$;

-- notifications.id ketma-ketligi qo'lda qo'yilgan id'lardan orqada qolmasin,
-- aks holda keyingi insert "duplicate key" beradi.
select setval(
  pg_get_serial_sequence('public.notifications', 'id'),
  coalesce((select max(id) from public.notifications), 1),
  true
);

-- Tekshiruv: har bir jadvalda nechta qator bor.
select 'stores' as jadval, count(*) from public.stores
union all select 'users', count(*) from public.users
union all select 'clients', count(*) from public.clients
union all select 'notifications', count(*) from public.notifications
union all select 'attendance', count(*) from public.attendance
union all select 'social_channels', count(*) from public.social_channels
union all select 'conversations', count(*) from public.conversations
union all select 'messages', count(*) from public.messages
union all select 'meta_ad_accounts', count(*) from public.meta_ad_accounts
union all select 'meta_ad_leads', count(*) from public.meta_ad_leads
union all select 'sales_checks', count(*) from public.sales_checks
union all select 'warehouse_orders', count(*) from public.warehouse_orders
union all select 'warehouse_order_items', count(*) from public.warehouse_order_items
union all select 'warehouse_stock', count(*) from public.warehouse_stock
union all select 'warranty_tickets', count(*) from public.warranty_tickets
union all select 'vacancies', count(*) from public.vacancies
union all select 'price_labels', count(*) from public.price_labels
union all select 'media_files', count(*) from public.media_files
order by 1;
