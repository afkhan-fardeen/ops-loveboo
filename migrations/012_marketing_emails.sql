-- Marketing: the email plan (one row per email send, e.g. every Sunday and Thursday). Run once in the ops Supabase SQL Editor.
create table if not exists mkt_emails (
  id         uuid primary key default gen_random_uuid(),
  send_on    date not null,
  name       text not null default '',            -- the theme, e.g. "Mums & Babies"
  subject    text not null default '',
  status     text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'ready', 'live', 'done')),
  owner_id   uuid references profiles (id) on delete set null,
  products   jsonb not null default '[]',         -- [{ "name": "...", "url": "https://...", "note": "..." }]
  copy       text not null default '',
  notes      text not null default '',
  links      jsonb not null default '[]',         -- [{ "label": "...", "url": "https://..." }]  Drive, Klaviyo, designs
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mkt_emails_send_idx on mkt_emails (send_on);
alter table mkt_emails enable row level security;   -- no policies: the portal reads and writes with the service role
