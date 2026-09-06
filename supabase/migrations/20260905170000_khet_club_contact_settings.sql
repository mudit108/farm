-- Contact email/phone become admin-editable settings instead of env
-- vars, so they can be changed from /admin/crops without a redeploy.
-- Reusing khet_club_season as the general farm-settings singleton
-- (consistent with total_plots, which lives there for the same reason).
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_season
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

drop function if exists public.khet_club_get_season();

create function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text,
  sowing_date date, estimated_harvest date, registration_deadline date,
  total_plots int, contact_email text, contact_phone text
)
language sql
security definer
stable
set search_path = public
as $$
  select current_stage, progress, health, sowing_date, estimated_harvest, registration_deadline,
         total_plots, contact_email, contact_phone
  from public.khet_club_season where id = 1;
$$;

revoke all on function public.khet_club_get_season() from public;
grant execute on function public.khet_club_get_season() to anon, authenticated;
