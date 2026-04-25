-- Voer dit één keer uit in Supabase SQL Editor (Project → SQL → New query)

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  login_code text not null unique,
  mail_sent_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  login_code text not null unique references employees(login_code) on delete cascade,
  answers jsonb not null,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- We benaderen de DB enkel via de service-role key vanuit server-side API routes,
-- dus RLS staat aan en blokkeert standaard alle anonieme toegang.
alter table employees enable row level security;
alter table responses enable row level security;
