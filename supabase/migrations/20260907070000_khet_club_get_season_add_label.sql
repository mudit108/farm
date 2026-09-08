-- season_label was added to khet_club_season during the rollover
-- feature but never added to this RPC's return shape — the only page
-- reading it (admin/crops) queries the table directly with service_role,
-- which masked the gap. Member-facing pages (My Farm, Select Plot) need
-- it through the public RPC, same as every other season field.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

drop function if exists public.khet_club_get_season();

create function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text,
  sowing_date date, estimated_harvest date, registration_deadline date,
  total_plots int, contact_email text, contact_phone text,
  fff_collected_inr int, warehouse_capacity_tonnes int, season_label text
)
language sql
security definer
stable
set search_path = public
as $$
  select current_stage, progress, health, sowing_date, estimated_harvest, registration_deadline,
         total_plots, contact_email, contact_phone, fff_collected_inr, warehouse_capacity_tonnes, season_label
  from public.khet_club_season where id = 1;
$$;

revoke all on function public.khet_club_get_season() from public;
grant execute on function public.khet_club_get_season() to anon, authenticated;
