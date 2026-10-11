alter table daily_sales
  add column if not exists gross_sales numeric(12,2) not null default 0,
  add column if not exists returns     numeric(12,2) not null default 0,
  add column if not exists shipping    numeric(12,2) not null default 0,
  add column if not exists taxes       numeric(12,2) not null default 0,
  add column if not exists total_sales numeric(12,2) not null default 0;
