-- Omnichannel CRM hardening for Instagram Messaging and Telegram Business.
-- Idempotent: safe to apply after 20260726_capture_social_inbox_schema.sql.

begin;

alter table public.social_channels
  add column if not exists connection_type text not null default 'bot',
  add column if not exists business_connection_id text,
  add column if not exists business_account_user_id text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists health_checked_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.conversations
  add column if not exists business_connection_id text,
  add column if not exists last_inbound_at timestamptz,
  add column if not exists last_outbound_at timestamptz,
  add column if not exists first_response_at timestamptz;

alter table public.messages
  add column if not exists delivery_status text not null default 'received';

create index if not exists social_channels_business_connection_idx
  on public.social_channels (business_connection_id)
  where business_connection_id is not null;

create index if not exists conversations_open_inbox_idx
  on public.conversations (status, last_message_at desc)
  where status <> 'closed';

create index if not exists conversations_response_window_idx
  on public.conversations (platform, last_inbound_at desc);

create index if not exists messages_delivery_status_idx
  on public.messages (delivery_status, created_at desc)
  where direction = 'out';

commit;

-- Customer conversations and provider tokens are server-only. Cloudflare
-- Functions use the service-role key, so enabling RLS does not block the CRM
-- API but does stop direct anon/authenticated-key access.
alter table public.social_channels enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
