-- Meta Lead Ads + click-to-message attribution.
-- Idempotent and safe to apply before the corresponding Cloudflare deploy.

begin;

create table if not exists public.meta_ad_accounts (
  id uuid primary key default gen_random_uuid(),
  external_account_id text not null unique,
  display_name text not null default '',
  access_token text not null,
  account_status integer not null default 0,
  currency text not null default '',
  timezone_name text not null default '',
  token_expires_at timestamptz,
  status text not null default 'connected',
  connected_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_ad_leads (
  id uuid primary key default gen_random_uuid(),
  leadgen_id text not null unique,
  page_id text not null,
  form_id text,
  ad_id text,
  ad_name text not null default '',
  adset_id text,
  adset_name text not null default '',
  campaign_id text,
  campaign_name text not null default '',
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  field_data jsonb not null default '[]'::jsonb,
  client_id uuid,
  processing_status text not null default 'processing',
  last_error text not null default '',
  provider_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations
  add column if not exists meta_ad_id text,
  add column if not exists meta_referral_source text,
  add column if not exists meta_referral_url text;

create index if not exists meta_ad_leads_page_created_idx
  on public.meta_ad_leads (page_id, provider_created_at desc);

create index if not exists meta_ad_leads_campaign_created_idx
  on public.meta_ad_leads (campaign_id, provider_created_at desc);

create index if not exists conversations_meta_ad_id_idx
  on public.conversations (meta_ad_id)
  where meta_ad_id is not null;

commit;

alter table public.meta_ad_accounts enable row level security;
alter table public.meta_ad_leads enable row level security;
