-- Season rollover. Until now khet_club_season was a single hardcoded
-- row (id=1) with no concept of a season ending — so closing a season
-- and starting the next had no defined path, and members' plot history
-- would have been overwritten.
--
-- Design principle: ARCHIVE, NEVER DELETE. A member's past seasons are
-- their proof of participation; certificates and receipts must keep
-- resolving forever. Rollover snapshots the finished season, stamps
-- existing records with it, then frees plots for the next one.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_season_archive (
  id uuid primary key default gen_random_uuid(),
  season_label text not null,
  crop_name text not null,
  sowing_date date,
  harvest_date date,
  total_plots int not null,
  plots_filled int not null,
  members_count int not null,
  revenue_inr int not null default 0,
  fff_collected_inr int not null default 0,
  closed_at timestamptz not null default now(),
  closed_by uuid references auth.users(id)
);

alter table public.khet_club_season_archive enable row level security;

create policy "anyone can read season archive" on public.khet_club_season_archive
  for select to anon, authenticated using (true);

revoke all on public.khet_club_season_archive from anon, authenticated;
grant select on public.khet_club_season_archive to anon, authenticated;
grant all on public.khet_club_season_archive to service_role;

alter table public.khet_club_plots
  add column if not exists archived_season_id uuid references public.khet_club_season_archive(id);
alter table public.khet_club_certificates
  add column if not exists archived_season_id uuid references public.khet_club_season_archive(id);

alter table public.khet_club_season
  add column if not exists season_label text not null default 'Wheat Season 2026-27';
