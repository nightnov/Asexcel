-- Creates support_requests and email_logs, which were part of schema.sql
-- but never got applied to this database. Safe to re-run.

create extension if not exists "uuid-ossp";

create table if not exists public.support_requests (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  email text,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.support_requests enable row level security;

create table if not exists public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  category text not null check (category in ('support', 'pro_confirmation', 'welcome', 'otp_code')),
  recipient text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

alter table public.email_logs enable row level security;

grant select, insert, update, delete on public.support_requests to authenticated, service_role;
grant select, insert, update, delete on public.email_logs to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
