-- A member's FIRST harvest preference save stays direct (khet_club_
-- harvest_preferences.user_id is already the primary key, so a second
-- direct INSERT attempt naturally fails — the app switches from
-- .upsert() to .insert() to make this the actual enforcement, not just
-- a UI convention). Any CHANGE after that goes through this request
-- table instead and only takes effect once an admin approves it.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_harvest_preference_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_method text not null check (requested_method in ('home-delivery', 'processed', 'sell-to-market')),
  requested_schedule text not null check (requested_schedule in ('one-time', 'monthly')),
  requested_installment_kg int check (requested_installment_kg is null or requested_installment_kg > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

-- Only one pending request per member at a time — enforced at the
-- database level, not just in the UI.
create unique index khet_club_harvest_pref_requests_one_pending
  on public.khet_club_harvest_preference_requests(user_id)
  where status = 'pending';

alter table public.khet_club_harvest_preference_requests enable row level security;

create policy "users read own harvest requests" on public.khet_club_harvest_preference_requests
  for select to authenticated using (user_id = auth.uid());
create policy "users insert own harvest requests" on public.khet_club_harvest_preference_requests
  for insert to authenticated with check (user_id = auth.uid());

-- Minimal, column-scoped grants from the start (per the lesson from the
-- privilege hardening migration) — status/reviewed_at/reviewed_by are
-- NOT grantable to authenticated at all; only service_role (the admin
-- approve/reject actions) can ever touch them. Verified via live
-- exploit attempt before shipping.
revoke all on public.khet_club_harvest_preference_requests from anon, authenticated;
grant select on public.khet_club_harvest_preference_requests to authenticated;
grant insert (user_id, requested_method, requested_schedule, requested_installment_kg)
  on public.khet_club_harvest_preference_requests to authenticated;
grant all on public.khet_club_harvest_preference_requests to service_role;
