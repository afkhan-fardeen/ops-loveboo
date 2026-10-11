alter table daily_sales add column if not exists discounts numeric(12,2) not null default 0;
