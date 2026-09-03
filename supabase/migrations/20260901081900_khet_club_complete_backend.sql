-- Real backend for the remaining demo-data areas: farm updates, farm
-- visit requests, cameras, documents, support messages, and season state.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

-- ---------------------------------------------------------------------
-- Farm updates (public feed — no PII, safe to read for anyone)
-- ---------------------------------------------------------------------
create table public.khet_club_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.khet_club_updates enable row level security;
create policy "anyone can read updates" on public.khet_club_updates
  for select to anon, authenticated using (true);
grant select on public.khet_club_updates to anon, authenticated;
grant all on public.khet_club_updates to service_role;

-- ---------------------------------------------------------------------
-- Farm visit requests
-- ---------------------------------------------------------------------
create table public.khet_club_farm_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preferred_date date not null,
  visitors int not null default 1,
  phone text,
  notes text,
  status text not null default 'requested' check (status in ('requested', 'approved', 'declined', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.khet_club_farm_visits enable row level security;
create policy "users manage own visit requests" on public.khet_club_farm_visits
  for select to authenticated using (user_id = auth.uid());
create policy "users insert own visit requests" on public.khet_club_farm_visits
  for insert to authenticated with check (user_id = auth.uid());
grant select, insert on public.khet_club_farm_visits to authenticated;
grant all on public.khet_club_farm_visits to service_role;

-- ---------------------------------------------------------------------
-- Cameras (stream_url must never reach the browser — locked to
-- service_role; customers get status only via a narrow function below)
-- ---------------------------------------------------------------------
create table public.khet_club_cameras (
  id uuid primary key default gen_random_uuid(),
  plot_number int references public.khet_club_plots(plot_number) on delete set null,
  name text not null,
  stream_url text,
  status text not null default 'not_configured' check (status in ('online', 'offline', 'not_configured'))
);

alter table public.khet_club_cameras enable row level security;
grant all on public.khet_club_cameras to service_role;

create or replace function public.khet_club_my_camera()
returns table(camera_name text, status text)
language sql
security definer
stable
set search_path = public
as $$
  select c.name, c.status
  from public.khet_club_cameras c
  join public.khet_club_plots p on p.plot_number = c.plot_number
  where p.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.khet_club_my_camera() from public;
revoke execute on function public.khet_club_my_camera() from anon;
grant execute on function public.khet_club_my_camera() to authenticated;

-- ---------------------------------------------------------------------
-- Documents (admin-attached links — user_id null = shared/template doc)
-- ---------------------------------------------------------------------
create table public.khet_club_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

alter table public.khet_club_documents enable row level security;
create policy "users read own or shared documents" on public.khet_club_documents
  for select to authenticated using (user_id = auth.uid() or user_id is null);
grant select on public.khet_club_documents to authenticated;
grant all on public.khet_club_documents to service_role;

-- ---------------------------------------------------------------------
-- Support messages
-- ---------------------------------------------------------------------
create table public.khet_club_support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.khet_club_support_messages enable row level security;
create policy "users manage own support messages" on public.khet_club_support_messages
  for select to authenticated using (user_id = auth.uid());
create policy "users insert own support messages" on public.khet_club_support_messages
  for insert to authenticated with check (user_id = auth.uid());
grant select, insert on public.khet_club_support_messages to authenticated;
grant all on public.khet_club_support_messages to service_role;

-- ---------------------------------------------------------------------
-- Season state (singleton — one crop, uniform stage/progress for everyone)
-- ---------------------------------------------------------------------
create table public.khet_club_season (
  id smallint primary key default 1 check (id = 1),
  current_stage text not null default 'Field Preparation',
  progress smallint not null default 0 check (progress between 0 and 100),
  health text not null default 'Preparing for Season',
  sowing_date date,
  estimated_harvest date,
  updated_at timestamptz not null default now()
);

insert into public.khet_club_season (id) values (1);

alter table public.khet_club_season enable row level security;
grant all on public.khet_club_season to service_role;

create or replace function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text,
  sowing_date date, estimated_harvest date
)
language sql
security definer
stable
set search_path = public
as $$
  select current_stage, progress, health, sowing_date, estimated_harvest
  from public.khet_club_season where id = 1;
$$;

revoke all on function public.khet_club_get_season() from public;
grant execute on function public.khet_club_get_season() to anon, authenticated;

-- Seed content (replaces the old demoUpdates array — these are now real,
-- admin-editable rows via /admin/updates and /admin/crops).
update public.khet_club_season
set progress = 5, current_stage = 'Field Preparation', health = 'Preparing for Season',
    sowing_date = '2026-11-05', estimated_harvest = '2027-04-15'
where id = 1;

insert into public.khet_club_updates (title, description, created_at) values
  ('Plots selected for wheat season', 'This season''s Gehu (wheat) plots have been marked for cultivation.', '2026-08-10T00:00:00Z'),
  ('Soil testing completed', 'Soil health checked and organic manure application planned ahead of sowing.', '2026-08-22T00:00:00Z'),
  ('Field preparation underway', 'Ploughing and levelling in progress ahead of the Diwali sowing window.', '2026-08-28T00:00:00Z');
