-- Harvest delivery tracking. confirmed_total_kg is the ACTUAL harvest
-- amount for a member (set by admin once harvest is weighed — the
-- wheatMinKg/wheatMaxKg range shown pre-harvest is just an estimate).
-- Deliveries are logged against that total as they happen.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").
--
-- Grants below are deliberately minimal from the start, following the
-- lesson from the privilege hardening migration: confirmed_total_kg is
-- NOT added to any authenticated grant (admin/service_role only), and
-- khet_club_harvest_deliveries gets SELECT-only for authenticated, with
-- every grant verified via a live exploit attempt before any app code
-- was written against it.

alter table public.khet_club_harvest_preferences
  add column if not exists confirmed_total_kg int check (confirmed_total_kg is null or confirmed_total_kg > 0);

create table public.khet_club_harvest_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kg_delivered int not null check (kg_delivered > 0),
  delivered_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.khet_club_harvest_deliveries enable row level security;

create policy "users read own harvest deliveries" on public.khet_club_harvest_deliveries
  for select to authenticated using (user_id = auth.uid());

revoke all on public.khet_club_harvest_deliveries from anon, authenticated;
grant select on public.khet_club_harvest_deliveries to authenticated;
grant all on public.khet_club_harvest_deliveries to service_role;

create index khet_club_harvest_deliveries_user_id_idx
  on public.khet_club_harvest_deliveries(user_id);
