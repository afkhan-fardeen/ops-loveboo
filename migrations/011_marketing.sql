-- Marketing module: campaigns / events and the deliverables inside them. Run once in the ops Supabase SQL Editor.
create table if not exists mkt_campaigns (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  kind       text not null default 'campaign' check (kind in ('campaign', 'event', 'launch', 'sale', 'key_date')),
  status     text not null default 'planned' check (status in ('planned', 'confirmed', 'cancelled')),
  colour     text not null default '#006D68',
  starts_on  date not null,
  ends_on    date not null,
  owner_id   uuid references profiles (id) on delete set null,
  markets    text[] not null default '{}',
  offer      text not null default '',
  brief      text not null default '',
  links      jsonb not null default '[]',      -- [{ "label": "...", "url": "https://..." }]
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index if not exists mkt_campaigns_dates_idx on mkt_campaigns (starts_on, ends_on);

create table if not exists mkt_items (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid references mkt_campaigns (id) on delete cascade,
  title       text not null,
  type        text not null default 'other',
  status      text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'ready', 'live', 'done')),
  due_on      date,
  live_on     date,
  owner_id    uuid references profiles (id) on delete set null,
  markets     text[] not null default '{}',
  links       jsonb not null default '[]',
  notes       text not null default '',
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists mkt_items_campaign_idx on mkt_items (campaign_id);
create index if not exists mkt_items_due_idx on mkt_items (due_on);
create index if not exists mkt_items_live_idx on mkt_items (live_on);

alter table mkt_campaigns enable row level security;   -- no policies: the portal reads and writes with the service role
alter table mkt_items enable row level security;
