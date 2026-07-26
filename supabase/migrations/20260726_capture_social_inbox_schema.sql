-- Capture the omnichannel inbox schema in version control.
--
-- social_channels, conversations and messages were created directly in the
-- Supabase dashboard and were never represented as SQL. The live project was
-- therefore the only copy of their definition: losing it, or needing a staging
-- environment, meant reconstructing the schema by hand.
--
-- IMPORTANT: this file was reconstructed from how functions/api/*.js reads and
-- writes these tables, not exported from the live database. Column names,
-- enum values and relationships are taken directly from the code and are
-- reliable. Exact types, defaults and pre-existing indexes may differ from
-- production. Verify with the query at the bottom of this file before relying
-- on it to rebuild the project from scratch.
--
-- Every statement is idempotent, so running this against the existing project
-- is a safe no-op that changes no data and no runtime behaviour.

begin;

-- ---------------------------------------------------------------------------
-- social_channels: one row per connected messaging account.
-- Written by functions/api/integrations.js, read by functions/api/_social.js.
-- ---------------------------------------------------------------------------
create table if not exists public.social_channels (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  display_name text not null default '',
  external_account_id text not null default '',
  -- Bot token (Telegram) or page access token (Meta). Never leaves the server:
  -- publicChannel() in integrations.js strips it from every API response.
  access_token text,
  webhook_verify_token text,
  status text not null default 'pending',
  last_error text not null default '',
  connected_by uuid,
  created_at timestamptz not null default now()
);

alter table public.social_channels
  add column if not exists platform text,
  add column if not exists display_name text,
  add column if not exists external_account_id text,
  add column if not exists access_token text,
  add column if not exists webhook_verify_token text,
  add column if not exists status text,
  add column if not exists last_error text,
  add column if not exists connected_by uuid,
  add column if not exists created_at timestamptz;

-- findChannelByToken() looks a channel up by this value on every Meta webhook
-- verification, and telegram-webhook.js matches the secret token per request.
create index if not exists social_channels_webhook_verify_token_idx
  on public.social_channels (webhook_verify_token);

-- findChannelByPlatform() orders by created_at desc and takes the newest.
create index if not exists social_channels_platform_created_at_idx
  on public.social_channels (platform, created_at desc);

-- ---------------------------------------------------------------------------
-- conversations: one thread per contact per channel.
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.social_channels (id) on delete cascade,
  platform text not null,
  external_chat_id text not null,
  contact_name text not null default '',
  contact_handle text,
  -- new -> open -> answered -> closed (see _social.js and messages.js)
  status text not null default 'new',
  -- null means unclaimed. A manager may only read or reply to a thread that is
  -- unassigned or already theirs; see _conversation_access.js.
  assigned_manager_id uuid,
  last_message_at timestamptz,
  last_message_preview text not null default '',
  unread_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.conversations
  add column if not exists channel_id uuid,
  add column if not exists platform text,
  add column if not exists external_chat_id text,
  add column if not exists contact_name text,
  add column if not exists contact_handle text,
  add column if not exists status text,
  add column if not exists assigned_manager_id uuid,
  add column if not exists last_message_at timestamptz,
  add column if not exists last_message_preview text,
  add column if not exists unread_count integer,
  add column if not exists created_at timestamptz;

create index if not exists conversations_channel_chat_idx
  on public.conversations (channel_id, external_chat_id);

-- The inbox lists by recency and filters by assignment.
create index if not exists conversations_last_message_at_idx
  on public.conversations (last_message_at desc);

create index if not exists conversations_assigned_manager_idx
  on public.conversations (assigned_manager_id);

-- ---------------------------------------------------------------------------
-- messages: every inbound and outbound message in a thread.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  -- 'in' from the contact, 'out' from a manager.
  direction text not null,
  -- 'contact' or 'manager'.
  sender_type text not null,
  sender_user_id uuid,
  -- 'text', 'image' or 'comment' (Instagram/Facebook comments share the inbox).
  message_type text not null default 'text',
  body text not null default '',
  attachment_url text,
  -- Provider-side id. Used to make webhook retries idempotent.
  external_message_id text,
  created_at timestamptz not null default now()
);

alter table public.messages
  add column if not exists conversation_id uuid,
  add column if not exists direction text,
  add column if not exists sender_type text,
  add column if not exists sender_user_id uuid,
  add column if not exists message_type text,
  add column if not exists body text,
  add column if not exists attachment_url text,
  add column if not exists external_message_id text,
  add column if not exists created_at timestamptz;

create index if not exists messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at);

-- recordIncomingMessage() dedupes on this pair before inserting.
create index if not exists messages_conversation_external_id_idx
  on public.messages (conversation_id, external_message_id);

commit;

-- ---------------------------------------------------------------------------
-- Uniqueness that makes webhook retries safe.
--
-- Kept outside the transaction above and wrapped so that pre-existing
-- duplicate rows produce a notice instead of failing the whole migration.
-- The application already dedupes by reading before it writes, but a
-- constraint is what actually holds under two concurrent webhook deliveries.
-- If either notice appears, clean the duplicates and re-run this block.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'conversations_channel_external_chat_key'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_channel_external_chat_key
      unique (channel_id, external_chat_id);
  end if;
exception when others then
  raise notice 'Skipped conversations unique constraint: %', sqlerrm;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_conversation_external_message_key'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_conversation_external_message_key
      unique (conversation_id, external_message_id);
  end if;
exception when others then
  raise notice 'Skipped messages unique constraint: %', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Row level security.
--
-- Every request to these tables comes from Cloudflare Functions using the
-- service role key, which bypasses RLS; the browser never contacts Supabase
-- directly and only ever calls /api/*. Enabling RLS with no policies therefore
-- changes nothing for the application while ensuring that an anon or
-- authenticated key cannot read customer conversations or stored access
-- tokens if one is ever exposed.
--
-- Commented out because it alters live table settings. Uncomment and run once
-- you have confirmed nothing else connects to this project with an anon key.
-- ---------------------------------------------------------------------------
-- alter table public.social_channels enable row level security;
-- alter table public.conversations   enable row level security;
-- alter table public.messages        enable row level security;

-- ---------------------------------------------------------------------------
-- Verification. Run this in the Supabase SQL editor and compare the output
-- with the definitions above to confirm this file matches production.
-- ---------------------------------------------------------------------------
-- select table_name, column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('social_channels', 'conversations', 'messages')
-- order by table_name, ordinal_position;
