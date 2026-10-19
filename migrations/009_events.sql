-- Events module: events, and the registrations copied in from the registration site's webhook.
create table if not exists events (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  starts_on       date,
  ends_on         date,
  collection_text text not null default '',   -- shown in the guest email: where/when to collect the gift
  email_enabled   boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists event_registrations (
  id              bigserial primary key,
  registration_id text not null unique,        -- id of the row in the registration site's database
  client_id       text,
  event_id        uuid references events (id),
  first_name      text not null default '',
  last_name       text,
  email           text not null,
  phone           text,
  is_parent       text,
  source          text,
  prize           text,                        -- null = no prize
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  registered_at   timestamptz not null,
  email_status    text not null default 'pending' check (email_status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  email_attempts  int not null default 0,
  email_error     text,
  emailed_at      timestamptz,
  resend_id       text,
  updated_at      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index if not exists event_registrations_event_idx on event_registrations (event_id, registered_at desc);
create index if not exists event_registrations_email_idx on event_registrations (email_status) where email_status <> 'sent';

alter table events enable row level security;
alter table event_registrations enable row level security;

insert into events (slug, name, starts_on, ends_on, collection_text)
values ('baby-expo-2026', 'Dubai Baby Expo 2026', null, null, '')
on conflict (slug) do nothing;
