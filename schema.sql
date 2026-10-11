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

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null default 'user' check (role in ('admin','user')),
  modules    text[] not null default '{}',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- All access is server-side with the service role key. RLS on with no policies
-- means the public anon key (and signed-in users calling the API directly) can read nothing.
alter table daily_sales enable row level security;
alter table profiles    enable row level security;
