-- Warehouse capacity is stated publicly (harvest process section, FAQ,
-- plan inclusions), so it needs to be editable when the real facility
-- changes — a hardcoded "30 tonnes" would quietly become a false claim
-- on a site whose whole value is that its claims are true.
-- Lives on khet_club_season alongside the other admin-set public
-- settings (total_plots, contact info, fff_collected_inr).
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_season
  add column if not exists warehouse_capacity_tonnes int not null default 30;

drop function if exists public.khet_club_get_season();

create function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text,
  sowing_date date, estimated_harvest date, registration_deadline date,
  total_plots int, contact_email text, contact_phone text,
  fff_collected_inr int, warehouse_capacity_tonnes int
)
language sql
security definer
stable
set search_path = public
as $$
  select current_stage, progress, health, sowing_date, estimated_harvest, registration_deadline,
         total_plots, contact_email, contact_phone, fff_collected_inr, warehouse_capacity_tonnes
  from public.khet_club_season where id = 1;
$$;

revoke all on function public.khet_club_get_season() from public;
grant execute on function public.khet_club_get_season() to anon, authenticated;
