-- Sample table for the dashboard. Run in Supabase → SQL Editor.
create table if not exists public.items (
  id          bigint generated always as identity primary key,
  name        text not null,
  status      text not null default 'active',
  amount      numeric(10,2) default 0,
  created_at  timestamptz not null default now()
);

-- Let the browser (anon key) read this table. Tighten for production.
alter table public.items enable row level security;

drop policy if exists "Allow anon read" on public.items;
create policy "Allow anon read"
  on public.items for select
  to anon
  using (true);

-- Optional demo data spread over the last 14 days
insert into public.items (name, status, amount, created_at)
select
  'Sample item ' || g,
  (array['active','pending','archived'])[1 + (g % 3)],
  round((random() * 500)::numeric, 2),
  now() - (random() * interval '14 days')
from generate_series(1, 60) as g;
