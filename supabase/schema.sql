-- Window — full schema. Run in the Supabase SQL editor.
-- RLS is enabled on every table. bracket_score / bracket_tier are
-- excluded from client reads via column-level grants (see bottom).

create extension if not exists pgcrypto;

-- ------------------------------------------------------------- waitlist
-- Pre-launch signups. Public may insert (join) but never read the list.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  referrer text,
  created_at timestamptz default now()
);
alter table public.waitlist enable row level security;
drop policy if exists "waitlist public join" on public.waitlist;
create policy "waitlist public join" on public.waitlist
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 320);

-- ---------------------------------------------------------------- users
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now(),
  onboarding_complete boolean default false,
  bracket_score numeric(4,2),          -- AI-assigned, 0–10, never shown to user
  bracket_tier text,                   -- '0-4.5' | '4.5-6.0' | '6.0-7.5' | '7.5-9.0' | '9.0-10'
  first_name text,                     -- shown only after step 4 unlock
  gender text check (gender in ('man','woman','nonbinary')),
  seeking text[],
  city text,
  age integer check (age >= 18),
  liveness_verified boolean default false,
  voice_fingerprint_stored boolean default false,
  last_active timestamptz,
  behavioral_score numeric(4,2) default 5.0
);

-- Rows are created by a trigger when an auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- photos
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  storage_path text,
  ai_score numeric(4,2),               -- per-photo score from Replicate, server-side only
  is_best boolean default false,       -- AI-selected best photo, revealed at step 3
  created_at timestamptz default now()
);

-- -------------------------------------------------------------- prompts
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  question_key text not null,
  answer text not null check (char_length(answer) <= 200),
  position integer check (position between 1 and 3),
  created_at timestamptz default now(),
  moderated boolean default false,
  flagged boolean default false,
  unique (user_id, position)
);

-- ---------------------------------------------------------------- likes
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references public.users(id) on delete cascade,
  to_user uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_user, to_user)
);

create table public.passes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references public.users(id) on delete cascade,
  to_user uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (from_user, to_user)
);

-- Mutual likes: rows where both (A→B) and (B→A) exist
create view public.mutual_likes as
select a.from_user as user_a, a.to_user as user_b, greatest(a.created_at, b.created_at) as matched_at
from public.likes a
join public.likes b on a.from_user = b.to_user and a.to_user = b.from_user
where a.from_user < a.to_user;

-- ---------------------------------------------------------- daily_match
create table public.daily_match (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  matched_user_id uuid references public.users(id) on delete cascade,
  date date not null,
  revealed boolean default false,
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- -------------------------------------------------------------- windows
create table public.windows (
  id uuid primary key default gen_random_uuid(),
  fired_at timestamptz default now(),
  bracket_tier text default 'all',
  expires_at timestamptz
);

-- ---------------------------------------------------------------- calls
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  room_url text,
  participant_a uuid references public.users(id),
  participant_b uuid references public.users(id),
  window_id uuid references public.windows(id),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  unlock_step integer default 1,       -- 1=voice only, 2=photo, 3=name+profile, 4=chat
  step_unlocked_by_a boolean default false,
  step_unlocked_by_b boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------- connections
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.users(id),
  user_b uuid references public.users(id),
  unlock_step integer default 1,       -- 1=prompts, 2=voice, 3=photo, 4=name+profile, 5=chat+socials
  chat_enabled boolean default false,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

-- ------------------------------------------------------------- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.connections(id) on delete cascade,
  sender_id uuid references public.users(id),
  content text not null,
  created_at timestamptz default now()
);

-- -------------------------------------------------------- social_shares
create table public.social_shares (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.connections(id) on delete cascade,
  user_id uuid references public.users(id),
  platform text check (platform in ('instagram','tiktok','spotify','apple_music')),
  handle text not null,
  created_at timestamptz default now(),
  unique (connection_id, user_id, platform)
);

-- -------------------------------------------------------------- reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id),
  reported_id uuid references public.users(id),
  reason text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------ voice fingerprints
create table public.voice_fingerprints (
  user_id uuid primary key references public.users(id) on delete cascade,
  embedding jsonb not null,            -- resemblyzer embedding vector
  created_at timestamptz default now()
);

-- ============================================================= RLS
alter table public.users enable row level security;
alter table public.photos enable row level security;
alter table public.prompts enable row level security;
alter table public.likes enable row level security;
alter table public.passes enable row level security;
alter table public.daily_match enable row level security;
alter table public.windows enable row level security;
alter table public.calls enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;
alter table public.social_shares enable row level security;
alter table public.reports enable row level security;
alter table public.voice_fingerprints enable row level security;

-- users: a user may read/update their own row, but NOT the scoring columns.
-- Column-level grants below exclude bracket_score, bracket_tier,
-- behavioral_score from the authenticated role entirely.
create policy "users read own" on public.users
  for select using (auth.uid() = id);
create policy "users update own" on public.users
  for update using (auth.uid() = id);

revoke select, update on public.users from authenticated, anon;
grant select (id, email, created_at, onboarding_complete, first_name, gender,
              seeking, city, age, liveness_verified, voice_fingerprint_stored,
              last_active)
  on public.users to authenticated;
grant update (first_name, gender, seeking, city, age, last_active)
  on public.users to authenticated;

-- photos: owner can insert/read their own. Other users NEVER read photos
-- directly — reveals go through the server (signed URLs, unlock-gated).
create policy "photos own" on public.photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke select on public.photos from authenticated, anon;
grant select (id, user_id, storage_path, is_best, created_at)
  on public.photos to authenticated;
grant insert (user_id, storage_path) on public.photos to authenticated;

-- prompts: owner full access. Anonymous browsing of others' prompts goes
-- through the server (service role) so identity columns stay controlled.
create policy "prompts own" on public.prompts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- likes: you can create likes from yourself and read likes you sent
create policy "likes insert own" on public.likes
  for insert with check (auth.uid() = from_user);
create policy "likes read own" on public.likes
  for select using (auth.uid() = from_user);

create policy "passes insert own" on public.passes
  for insert with check (auth.uid() = from_user);
create policy "passes read own" on public.passes
  for select using (auth.uid() = from_user);

-- daily_match: read your own row only (contents served via API, anonymized)
create policy "daily_match read own" on public.daily_match
  for select using (auth.uid() = user_id);
create policy "daily_match update own" on public.daily_match
  for update using (auth.uid() = user_id);

-- windows: any authenticated user can see active windows (fires for all)
create policy "windows read" on public.windows
  for select using (auth.role() = 'authenticated');

-- calls: participants only
create policy "calls read own" on public.calls
  for select using (auth.uid() in (participant_a, participant_b));

-- connections: participants only
create policy "connections read own" on public.connections
  for select using (auth.uid() in (user_a, user_b));

-- messages: participants of the connection; chat must be enabled to send
create policy "messages read" on public.messages
  for select using (
    exists (select 1 from public.connections c
            where c.id = connection_id and auth.uid() in (c.user_a, c.user_b))
  );
create policy "messages send" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (select 1 from public.connections c
            where c.id = connection_id
              and auth.uid() in (c.user_a, c.user_b)
              and c.chat_enabled)
  );

-- social_shares: visible to both parties of the connection
create policy "social read" on public.social_shares
  for select using (
    exists (select 1 from public.connections c
            where c.id = connection_id and auth.uid() in (c.user_a, c.user_b))
  );
create policy "social insert own" on public.social_shares
  for insert with check (auth.uid() = user_id);

create policy "reports insert" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- voice_fingerprints: no client access at all (service role only)

-- ============================================================= Storage
-- Private bucket for photos. Never public; serve via signed URLs only.
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "photo upload own folder" on storage.objects
  for insert with check (
    bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "photo read own folder" on storage.objects
  for select using (
    bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================= Realtime
alter publication supabase_realtime add table public.windows;
alter publication supabase_realtime add table public.calls;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.social_shares;
