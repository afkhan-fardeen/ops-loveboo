create table if not exists settings (
  key   text primary key,
  value jsonb not null
);
alter table settings enable row level security;
