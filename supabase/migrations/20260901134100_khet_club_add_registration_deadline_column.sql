-- Allow customers to buy additional plot bundles (upgrade/stack) up until
-- a registration deadline the admin controls, instead of being capped at
-- exactly one plan forever.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_season
  add column if not exists registration_deadline date;

-- A sensible default so the feature works immediately after applying this
-- migration. Change any time from /admin/crops.
update public.khet_club_season
set registration_deadline = '2026-11-01'
where id = 1 and registration_deadline is null;
