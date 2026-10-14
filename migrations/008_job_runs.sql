create table if not exists job_runs (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  source      text not null,               -- 'vercel' | 'github' | 'manual'
  outcome     text not null,               -- 'loaded' | 'emailed' | 'skipped' | 'error' | 'manual'
  detail      text not null default '',
  report_date text,
  ms          int not null default 0
);
create index if not exists job_runs_at_idx on job_runs (at desc);
alter table job_runs enable row level security;
