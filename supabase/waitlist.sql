-- Minimal waitlist table — run this on its own to get a live waitlist
-- without the full app schema. Safe to run before schema.sql; it's also
-- included there. Anonymous visitors may insert (join) but never read the
-- list back (no email harvesting via the public anon key).

create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  referrer text,
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;

-- Insert-only for the public. No select policy => nobody can read the
-- list with the anon key. You read signups from the dashboard / SQL editor.
drop policy if exists "waitlist public join" on public.waitlist;
create policy "waitlist public join" on public.waitlist
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 320);
