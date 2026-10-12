alter table daily_sales
  add column if not exists sessions       int           not null default 0,
  add column if not exists conversion     numeric(8,6)  not null default 0,
  add column if not exists sources        jsonb         not null default '[]',
  add column if not exists discount_codes jsonb         not null default '[]';
