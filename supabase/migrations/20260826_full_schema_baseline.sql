-- KUKAHOME CRM - to'liq schema baseline (public schema).
--
-- Nima uchun kerak: repodagi migratsiyalar to'liq emas edi - jadvallar,
-- funksiyalar va indekslarning ko'pchiligi to'g'ridan-to'g'ri Supabase
-- dashboard'ida yaratilgan va hech qayerda saqlanmagan. Ya'ni jonli baza
-- ularning yagona nusxasi edi.
--
-- Bu fayl 2026-08-26 holatidagi jonli bazadan pg_catalog orqali chiqarilgan
-- va bo'sh Postgres/Supabase loyihasida schema'ni noldan tiklaydi.
-- Ma'lumot (row) larni ko'chirmaydi - faqat struktura.
--
-- Hammasi idempotent, mavjud loyihada ishga tushirilsa hech narsani
-- o'zgartirmaydi.

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enum turlari
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'user_role') then
    create type public.user_role as enum (
      'admin', 'manager', 'hr', 'cashier', 'skladchi',
      'director', 'targetolog', 'community_manager', 'employee'
    );
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'warehouse_location_type') then
    create type public.warehouse_location_type as enum ('warehouse', 'showroom', 'both');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where n.nspname = 'public' and t.typname = 'warehouse_stage') then
    create type public.warehouse_stage as enum (
      'from_china', 'near_border', 'at_border', 'entered_country', 'arrived'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Jadvallar
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.users (
  id uuid default gen_random_uuid() not null,
  full_name text not null,
  login text not null,
  password_hash text not null,
  role public.user_role default 'manager'::public.user_role not null,
  store_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  phone text,
  telegram_id text
);

create table if not exists public.clients (
  id uuid default gen_random_uuid() not null,
  date date,
  store_id uuid,
  manager_id uuid,
  phone text not null,
  source text default 'new_client'::text not null,
  interest text default ''::text not null,
  note text default ''::text not null,
  status text default ''::text not null,
  price numeric(18,2) default 0 not null,
  result text default ''::text not null,
  created_at timestamp with time zone default now() not null,
  created_by uuid,
  currency text default 'UZS'::text not null
);

create sequence if not exists public.notifications_id_seq;

create table if not exists public.notifications (
  id bigint default nextval('public.notifications_id_seq'::regclass) not null,
  type text not null,
  to_user_id uuid,
  actor_user_id uuid,
  client_contact text default '-'::text not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default now() not null
);
alter sequence public.notifications_id_seq owned by public.notifications.id;

create table if not exists public.attendance (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  telegram_id text not null,
  work_date date not null,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  raw jsonb default '{}'::jsonb not null,
  synced_at timestamp with time zone default now() not null
);

create table if not exists public.social_channels (
  id uuid default gen_random_uuid() not null,
  platform text not null,
  display_name text default ''::text not null,
  external_account_id text,
  access_token text,
  webhook_verify_token text,
  status text default 'pending'::text not null,
  last_error text,
  connected_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  connection_type text default 'bot'::text not null,
  business_connection_id text,
  business_account_user_id text,
  token_expires_at timestamp with time zone,
  health_checked_at timestamp with time zone,
  config jsonb default '{}'::jsonb not null
);

create table if not exists public.conversations (
  id uuid default gen_random_uuid() not null,
  channel_id uuid not null,
  platform text not null,
  external_chat_id text not null,
  contact_name text default ''::text not null,
  contact_handle text,
  contact_avatar_url text,
  status text default 'new'::text not null,
  is_lead boolean default false not null,
  client_id uuid,
  assigned_manager_id uuid,
  last_message_at timestamp with time zone default now() not null,
  last_message_preview text default ''::text not null,
  unread_count integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  business_connection_id text,
  last_inbound_at timestamp with time zone,
  last_outbound_at timestamp with time zone,
  first_response_at timestamp with time zone,
  meta_ad_id text,
  meta_referral_source text,
  meta_referral_url text,
  thread_type text default 'dm'::text not null
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() not null,
  conversation_id uuid not null,
  direction text not null,
  sender_type text default 'contact'::text not null,
  sender_user_id uuid,
  message_type text default 'text'::text not null,
  body text default ''::text not null,
  attachment_url text,
  external_message_id text,
  created_at timestamp with time zone default now() not null,
  delivery_status text default 'received'::text not null
);

create table if not exists public.meta_ad_accounts (
  id uuid default gen_random_uuid() not null,
  external_account_id text not null,
  display_name text default ''::text not null,
  access_token text not null,
  account_status integer default 0 not null,
  currency text default ''::text not null,
  timezone_name text default ''::text not null,
  token_expires_at timestamp with time zone,
  status text default 'connected'::text not null,
  connected_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.meta_ad_leads (
  id uuid default gen_random_uuid() not null,
  leadgen_id text not null,
  page_id text not null,
  form_id text,
  ad_id text,
  ad_name text default ''::text not null,
  adset_id text,
  adset_name text default ''::text not null,
  campaign_id text,
  campaign_name text default ''::text not null,
  full_name text default ''::text not null,
  phone text default ''::text not null,
  email text default ''::text not null,
  field_data jsonb default '[]'::jsonb not null,
  client_id uuid,
  processing_status text default 'processing'::text not null,
  last_error text default ''::text not null,
  provider_created_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.sales_checks (
  id uuid default gen_random_uuid() not null,
  check_no bigint not null,
  store_id uuid,
  manager_id uuid,
  order_date date,
  form_data jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  created_by uuid,
  receipt_url text default ''::text not null,
  receipt_data_url text default ''::text not null,
  receipt_file_name text default ''::text not null
);

create table if not exists public.warehouse_orders (
  id uuid default gen_random_uuid() not null,
  stage public.warehouse_stage default 'from_china'::public.warehouse_stage not null,
  eta date,
  created_at timestamp with time zone default now() not null,
  created_by uuid
);

create table if not exists public.warehouse_order_items (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  model text not null,
  info text default ''::text not null,
  qty integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  status text default 'pending'::text not null,
  image_url text
);

create table if not exists public.warehouse_stock (
  id uuid default gen_random_uuid() not null,
  model text not null,
  info text default ''::text not null,
  qty integer default 0 not null,
  location_type public.warehouse_location_type default 'showroom'::public.warehouse_location_type not null,
  store_id uuid,
  status text default 'available'::text not null,
  reservation jsonb,
  created_at timestamp with time zone default now() not null,
  created_by uuid,
  image_url text,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.warranty_tickets (
  id uuid default gen_random_uuid() not null,
  ticket_no integer not null,
  store_id text,
  manager_id text,
  sale_date date,
  warranty_start_date date,
  warranty_end_date date,
  ticket_url text default ''::text not null,
  ticket_data_url text default ''::text not null,
  ticket_file_name text default ''::text not null,
  form_data jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.vacancies (
  id uuid default gen_random_uuid() not null,
  full_name text default ''::text not null,
  phone text default ''::text not null,
  position text default ''::text not null,
  note text default ''::text not null,
  resume_url text default ''::text not null,
  resume_file_name text default ''::text not null,
  photo_url text default ''::text not null,
  source text default 'website_vacancy'::text not null,
  status text default 'new'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.price_labels (
  id uuid default gen_random_uuid() not null,
  furniture_type text default ''::text not null,
  model text default ''::text not null,
  info text default ''::text not null,
  size text default ''::text not null,
  store_id uuid,
  image_url text default ''::text not null,
  discount_mode text default 'without'::text not null,
  cost_price numeric default 0 not null,
  discount_price numeric,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.media_files (
  id uuid default gen_random_uuid() not null,
  bucket text default 'crm-private'::text not null,
  path text not null,
  sales_check_id uuid,
  warehouse_stock_id uuid,
  warehouse_item_id uuid,
  created_at timestamp with time zone default now() not null
);


-- ---------------------------------------------------------------------------
-- Cheklovlar (PK / UNIQUE / CHECK / FK).
-- ALTER TABLE ... ADD CONSTRAINT da IF NOT EXISTS yo'q, shuning uchun har biri
-- katalogdan tekshiriladi - fayl qayta ishga tushirilsa xato bermaydi.
-- ---------------------------------------------------------------------------
do $$
declare
  stmt text;
begin
  foreach stmt in array array[
    'alter table public.attendance add constraint attendance_pkey primary key (id)',
    'alter table public.clients add constraint clients_pkey primary key (id)',
    'alter table public.conversations add constraint conversations_pkey primary key (id)',
    'alter table public.media_files add constraint media_files_pkey primary key (id)',
    'alter table public.messages add constraint messages_pkey primary key (id)',
    'alter table public.meta_ad_accounts add constraint meta_ad_accounts_pkey primary key (id)',
    'alter table public.meta_ad_leads add constraint meta_ad_leads_pkey primary key (id)',
    'alter table public.notifications add constraint notifications_pkey primary key (id)',
    'alter table public.price_labels add constraint price_labels_pkey primary key (id)',
    'alter table public.sales_checks add constraint sales_checks_pkey primary key (id)',
    'alter table public.social_channels add constraint social_channels_pkey primary key (id)',
    'alter table public.stores add constraint stores_pkey primary key (id)',
    'alter table public.users add constraint users_pkey primary key (id)',
    'alter table public.vacancies add constraint vacancies_pkey primary key (id)',
    'alter table public.warehouse_order_items add constraint warehouse_order_items_pkey primary key (id)',
    'alter table public.warehouse_orders add constraint warehouse_orders_pkey primary key (id)',
    'alter table public.warehouse_stock add constraint warehouse_stock_pkey primary key (id)',
    'alter table public.warranty_tickets add constraint warranty_tickets_pkey primary key (id)',
    'alter table public.attendance add constraint attendance_telegram_id_work_date_key unique (telegram_id, work_date)',
    'alter table public.conversations add constraint conversations_channel_id_external_chat_id_key unique (channel_id, external_chat_id)',
    'alter table public.media_files add constraint media_files_path_key unique (path)',
    'alter table public.messages add constraint messages_conversation_external_message_key unique (conversation_id, external_message_id)',
    'alter table public.meta_ad_accounts add constraint meta_ad_accounts_external_account_id_key unique (external_account_id)',
    'alter table public.meta_ad_leads add constraint meta_ad_leads_leadgen_id_key unique (leadgen_id)',
    'alter table public.sales_checks add constraint sales_checks_check_no_key unique (check_no)',
    'alter table public.stores add constraint stores_name_key unique (name)',
    'alter table public.users add constraint users_login_key unique (login)',
    'alter table public.clients add constraint clients_currency_check check (currency = any (array[''UZS''::text, ''USD''::text]))',
    'alter table public.conversations add constraint conversations_status_check check (status = any (array[''new''::text, ''open''::text, ''answered''::text, ''closed''::text]))',
    'alter table public.conversations add constraint conversations_thread_type_check check (thread_type = any (array[''dm''::text, ''comment''::text]))',
    'alter table public.media_files add constraint one_parent_only check (num_nonnulls(sales_check_id, warehouse_stock_id, warehouse_item_id) = 1)',
    'alter table public.messages add constraint messages_direction_check check (direction = any (array[''in''::text, ''out''::text]))',
    'alter table public.messages add constraint messages_message_type_check check (message_type = any (array[''text''::text, ''image''::text, ''comment''::text, ''file''::text]))',
    'alter table public.messages add constraint messages_sender_type_check check (sender_type = any (array[''contact''::text, ''manager''::text, ''system''::text]))',
    'alter table public.price_labels add constraint price_labels_discount_mode_check check (discount_mode = any (array[''with''::text, ''without''::text]))',
    'alter table public.social_channels add constraint social_channels_platform_check check (platform = any (array[''telegram''::text, ''facebook''::text, ''instagram''::text, ''whatsapp''::text, ''google_sheets''::text, ''meta_ads''::text]))',
    'alter table public.social_channels add constraint social_channels_status_check check (status = any (array[''pending''::text, ''connected''::text, ''error''::text, ''disconnected''::text]))',
    'alter table public.users add constraint users_phone_format_chk check ((phone is null) or (phone = ''''::text) or (phone ~ ''^\+998 [0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}$''::text))',
    'alter table public.warehouse_order_items add constraint warehouse_order_items_qty_check check (qty >= 0)',
    'alter table public.warehouse_stock add constraint warehouse_stock_qty_check check (qty >= 0)',
    'alter table public.attendance add constraint attendance_user_id_fkey foreign key (user_id) references public.users(id) on delete set null',
    'alter table public.clients add constraint clients_created_by_fkey foreign key (created_by) references public.users(id) on delete set null',
    'alter table public.clients add constraint clients_manager_id_fkey foreign key (manager_id) references public.users(id) on delete set null',
    'alter table public.clients add constraint clients_store_id_fkey foreign key (store_id) references public.stores(id) on delete set null',
    'alter table public.conversations add constraint conversations_assigned_manager_id_fkey foreign key (assigned_manager_id) references public.users(id) on delete set null',
    'alter table public.conversations add constraint conversations_channel_id_fkey foreign key (channel_id) references public.social_channels(id) on delete cascade',
    'alter table public.conversations add constraint conversations_client_id_fkey foreign key (client_id) references public.clients(id) on delete set null',
    'alter table public.media_files add constraint media_files_sales_check_id_fkey foreign key (sales_check_id) references public.sales_checks(id) on delete cascade',
    'alter table public.media_files add constraint media_files_warehouse_item_id_fkey foreign key (warehouse_item_id) references public.warehouse_order_items(id) on delete cascade',
    'alter table public.media_files add constraint media_files_warehouse_stock_id_fkey foreign key (warehouse_stock_id) references public.warehouse_stock(id) on delete cascade',
    'alter table public.messages add constraint messages_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade',
    'alter table public.messages add constraint messages_sender_user_id_fkey foreign key (sender_user_id) references public.users(id) on delete set null',
    'alter table public.notifications add constraint notifications_actor_user_id_fkey foreign key (actor_user_id) references public.users(id) on delete set null',
    'alter table public.notifications add constraint notifications_to_user_id_fkey foreign key (to_user_id) references public.users(id) on delete cascade',
    'alter table public.price_labels add constraint price_labels_created_by_fkey foreign key (created_by) references public.users(id) on delete set null',
    'alter table public.price_labels add constraint price_labels_store_id_fkey foreign key (store_id) references public.stores(id) on delete set null',
    'alter table public.sales_checks add constraint sales_checks_created_by_fkey foreign key (created_by) references public.users(id) on delete set null',
    'alter table public.sales_checks add constraint sales_checks_manager_id_fkey foreign key (manager_id) references public.users(id) on delete set null',
    'alter table public.sales_checks add constraint sales_checks_store_id_fkey foreign key (store_id) references public.stores(id) on delete set null',
    'alter table public.social_channels add constraint social_channels_connected_by_fkey foreign key (connected_by) references public.users(id) on delete set null',
    'alter table public.users add constraint users_store_id_fkey foreign key (store_id) references public.stores(id) on delete set null',
    'alter table public.warehouse_order_items add constraint warehouse_order_items_order_id_fkey foreign key (order_id) references public.warehouse_orders(id) on delete cascade',
    'alter table public.warehouse_orders add constraint warehouse_orders_created_by_fkey foreign key (created_by) references public.users(id) on delete set null',
    'alter table public.warehouse_stock add constraint warehouse_stock_created_by_fkey foreign key (created_by) references public.users(id) on delete set null',
    'alter table public.warehouse_stock add constraint warehouse_stock_store_id_fkey foreign key (store_id) references public.stores(id) on delete set null'
  ]
  loop
    begin
      execute stmt;
    exception
      when duplicate_table or duplicate_object or invalid_table_definition then null;
    end;
  end loop;
end
$$;


-- ---------------------------------------------------------------------------
-- Indekslar
-- ---------------------------------------------------------------------------
create index if not exists idx_attendance_user_date on public.attendance using btree (user_id, work_date);
create index if not exists idx_clients_created_at on public.clients using btree (created_at desc);
create index if not exists idx_clients_manager_id on public.clients using btree (manager_id);
create index if not exists idx_clients_store_id on public.clients using btree (store_id);
create index if not exists conversations_assigned_manager_idx on public.conversations using btree (assigned_manager_id);
create index if not exists conversations_channel_chat_idx on public.conversations using btree (channel_id, external_chat_id);
create index if not exists conversations_last_message_at_idx on public.conversations using btree (last_message_at desc);
create index if not exists conversations_meta_ad_id_idx on public.conversations using btree (meta_ad_id) where (meta_ad_id is not null);
create index if not exists conversations_open_inbox_idx on public.conversations using btree (status, last_message_at desc) where (status <> 'closed'::text);
create index if not exists conversations_response_window_idx on public.conversations using btree (platform, last_inbound_at desc);
create index if not exists conversations_thread_type_idx on public.conversations using btree (thread_type, last_message_at desc);
create index if not exists idx_conversations_channel on public.conversations using btree (channel_id);
create index if not exists idx_conversations_manager on public.conversations using btree (assigned_manager_id);
create index if not exists idx_conversations_status on public.conversations using btree (status);
create index if not exists idx_media_sales_check_id on public.media_files using btree (sales_check_id);
create index if not exists idx_media_warehouse_item_id on public.media_files using btree (warehouse_item_id);
create index if not exists idx_media_warehouse_stock_id on public.media_files using btree (warehouse_stock_id);
create index if not exists idx_messages_conversation on public.messages using btree (conversation_id, created_at);
create index if not exists messages_conversation_created_at_idx on public.messages using btree (conversation_id, created_at);
create index if not exists messages_conversation_external_id_idx on public.messages using btree (conversation_id, external_message_id);
create index if not exists messages_delivery_status_idx on public.messages using btree (delivery_status, created_at desc) where (direction = 'out'::text);
create index if not exists meta_ad_leads_campaign_created_idx on public.meta_ad_leads using btree (campaign_id, provider_created_at desc);
create index if not exists meta_ad_leads_page_created_idx on public.meta_ad_leads using btree (page_id, provider_created_at desc);
create index if not exists idx_notifications_to_user_id on public.notifications using btree (to_user_id);
create index if not exists idx_sales_checks_manager_id on public.sales_checks using btree (manager_id);
create index if not exists idx_sales_checks_store_id on public.sales_checks using btree (store_id);
create index if not exists social_channels_business_connection_idx on public.social_channels using btree (business_connection_id) where (business_connection_id is not null);
create index if not exists social_channels_platform_created_at_idx on public.social_channels using btree (platform, created_at desc);
create index if not exists social_channels_webhook_verify_token_idx on public.social_channels using btree (webhook_verify_token);
-- Login registrga sezgir emas, shuning uchun `Ali` va `ali` bir vaqtda bo'lolmaydi.
create unique index if not exists users_login_lower_key on public.users using btree (lower(btrim(login)));
create unique index if not exists users_telegram_id_key on public.users using btree (telegram_id) where (telegram_id is not null);
create index if not exists idx_vacancies_created_at on public.vacancies using btree (created_at desc);
create index if not exists idx_vacancies_status on public.vacancies using btree (status);
create index if not exists idx_warranty_tickets_created_at on public.warranty_tickets using btree (created_at desc);

-- ---------------------------------------------------------------------------
-- Funksiyalar
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.crm_touch_updated_at()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.enforce_media_limits()
returns trigger language plpgsql set search_path to 'public' as $function$
declare
  c integer;
begin
  if new.sales_check_id is not null then
    select count(*) into c from media_files
    where sales_check_id = new.sales_check_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    if c >= 1 then
      raise exception 'sales_check faqat 1 ta rasm qabul qiladi';
    end if;
  end if;

  if new.warehouse_stock_id is not null then
    select count(*) into c from media_files
    where warehouse_stock_id = new.warehouse_stock_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    if c >= 4 then
      raise exception 'warehouse_stock uchun maksimum 4 ta rasm';
    end if;
  end if;

  if new.warehouse_item_id is not null then
    select count(*) into c from media_files
    where warehouse_item_id = new.warehouse_item_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    if c >= 4 then
      raise exception 'warehouse_order_item uchun maksimum 4 ta rasm';
    end if;
  end if;

  return new;
end;
$function$;

-- Parolni faqat shu yerda o'rnatamiz - ilova kodi hech qachon hash yasamaydi.
create or replace function public.set_user_password(p_user_id uuid, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  if p_new_password is null or length(p_new_password) = 0 then
    raise exception 'empty_password';
  end if;

  update users
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = p_user_id;

  return found;
end;
$function$;

-- Login katta-kichik harfga sezgir emas va atrofidagi bo'shliqni e'tiborsiz
-- qoldiradi; eski ochiq matnli parollar shu yerda bcryptga ko'chiriladi.
create or replace function public.verify_login(p_login text, p_password text)
returns table (
  id uuid,
  full_name text,
  login text,
  role public.user_role,
  store_id uuid,
  phone text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_user public.users%rowtype;
  v_login text := lower(btrim(coalesce(p_login, '')));
  v_password text := coalesce(p_password, '');
  v_ok boolean := false;
begin
  if v_login = '' or v_password = '' then
    return;
  end if;

  select u.* into v_user
  from users u
  where lower(btrim(u.login)) = v_login
  order by (u.login = p_login) desc, u.created_at asc
  limit 1;

  if not found then
    return;
  end if;

  if v_user.password_hash ~ '^\$2[aby]\$\d{2}\$' then
    begin
      v_ok := v_user.password_hash = extensions.crypt(v_password, v_user.password_hash);
    exception when others then
      v_ok := false;
    end;
  else
    v_ok := v_user.password_hash = v_password;
    if v_ok then
      update users
      set password_hash = extensions.crypt(v_password, extensions.gen_salt('bf', 10)),
          updated_at = now()
      where users.id = v_user.id;
    end if;
  end if;

  if not v_ok then
    return;
  end if;

  return query
  select v_user.id, v_user.full_name, v_user.login, v_user.role,
         v_user.store_id, v_user.phone, v_user.created_at;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Triggerlar
-- ---------------------------------------------------------------------------
drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

drop trigger if exists trg_social_channels_updated_at on public.social_channels;
create trigger trg_social_channels_updated_at before update on public.social_channels
  for each row execute function public.set_updated_at();

drop trigger if exists trg_media_limits on public.media_files;
create trigger trg_media_limits before insert or update on public.media_files
  for each row execute function public.enforce_media_limits();

drop trigger if exists trg_sales_checks_updated_at on public.sales_checks;
create trigger trg_sales_checks_updated_at before update on public.sales_checks
  for each row execute function public.crm_touch_updated_at();

drop trigger if exists trg_vacancies_updated_at on public.vacancies;
create trigger trg_vacancies_updated_at before update on public.vacancies
  for each row execute function public.crm_touch_updated_at();

drop trigger if exists trg_warehouse_order_items_updated_at on public.warehouse_order_items;
create trigger trg_warehouse_order_items_updated_at before update on public.warehouse_order_items
  for each row execute function public.crm_touch_updated_at();

drop trigger if exists trg_warehouse_orders_updated_at on public.warehouse_orders;
create trigger trg_warehouse_orders_updated_at before update on public.warehouse_orders
  for each row execute function public.crm_touch_updated_at();

drop trigger if exists trg_warehouse_stock_updated_at on public.warehouse_stock;
create trigger trg_warehouse_stock_updated_at before update on public.warehouse_stock
  for each row execute function public.crm_touch_updated_at();

drop trigger if exists trg_warranty_tickets_updated_at on public.warranty_tickets;
create trigger trg_warranty_tickets_updated_at before update on public.warranty_tickets
  for each row execute function public.crm_touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: hamma jadvalda yoqilgan va bironta ham policy yo'q. Bu ataylab:
-- barcha kirish Cloudflare Functions orqali service role key bilan boradi
-- (u RLS ni chetlab o'tadi), anon/authenticated kalitlar esa hech nimani
-- ko'ra olmaydi.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'attendance', 'clients', 'conversations', 'media_files', 'messages',
    'meta_ad_accounts', 'meta_ad_leads', 'notifications', 'price_labels',
    'sales_checks', 'social_channels', 'stores', 'users', 'vacancies',
    'warehouse_order_items', 'warehouse_orders', 'warehouse_stock',
    'warranty_tickets'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end
$$;

revoke all on function public.verify_login(text, text) from public, anon, authenticated;
revoke all on function public.set_user_password(uuid, text) from public, anon, authenticated;
grant execute on function public.verify_login(text, text) to service_role;
grant execute on function public.set_user_password(uuid, text) to service_role;

commit;
