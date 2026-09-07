-- The Feeding Families Fund total shown publicly is admin-controlled,
-- separate from the auto-computed "earmarked from paid orders" figure
-- already shown internally on /admin (Overview and Finance). Admin may
-- have real reasons the two differ — offline contributions, timing of
-- actual wheat purchases vs. earmarking — so this is a deliberate,
-- editable value, not a read-only mirror of the internal calculation.
-- Seeded with the current real earmarked total (₹12,000, from 5 real
-- paid orders) as a sensible starting point.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_season
  add column if not exists fff_collected_inr int not null default 12000;

drop function if exists public.khet_club_get_season();

create function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text,
  sowing_date date, estimated_harvest date, registration_deadline date,
  total_plots int, contact_email text, contact_phone text, fff_collected_inr int
)
language sql
security definer
stable
set search_path = public
as $$
  select current_stage, progress, health, sowing_date, estimated_harvest, registration_deadline,
         total_plots, contact_email, contact_phone, fff_collected_inr
  from public.khet_club_season where id = 1;
$$;

revoke all on function public.khet_club_get_season() from public;
grant execute on function public.khet_club_get_season() to anon, authenticated;
