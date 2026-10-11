create table daily_sales (
  date         date primary key,
  net_sales    numeric(12,2) not null,
  orders       int           not null,
  units        int           not null,
  top_products jsonb         not null default '[]',
  currency     text          not null default 'GBP',
  emailed_at   timestamptz,
  created_at   timestamptz   not null default now()
);
alter table daily_sales enable row level security;
create policy "read for signed-in" on daily_sales for select to authenticated using (true);
