alter table daily_sales add column if not exists locations jsonb not null default '[]';
