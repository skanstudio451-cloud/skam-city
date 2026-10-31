create table items (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
create index on items (kind);
create table settings (id int primary key default 1, data jsonb not null default '{}');
insert into settings (id, data) values (1, '{}') on conflict do nothing;
alter table items enable row level security;
alter table settings enable row level security;
-- ثم أنشئ Bucket اسمه media (Public) من Storage
