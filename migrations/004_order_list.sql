alter table daily_sales add column if not exists order_list jsonb not null default '[]';
