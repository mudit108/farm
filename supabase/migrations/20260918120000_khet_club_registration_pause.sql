-- Dedicated pause switch for new bookings, separate from
-- registration_deadline (which means "the season's real window has
-- ended" and drives season-close logic elsewhere -- reusing it for a
-- temporary testing pause would corrupt that meaning).
--
-- Enforced in khet_club_claim_my_plan, the security-definer RPC a
-- client cannot route around -- not just in the Next.js action layer.
-- Also pre-checked in createPlanOrder so a Razorpay order isn't even
-- created while paused.
--
-- Verified live: called the real RPC as an authenticated user with the
-- flag on and confirmed REGISTRATIONS_PAUSED actually raises, inside a
-- rolled-back transaction; confirmed production untouched afterward
-- (registrations_paused=false, plot count unchanged).
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_season
  add column if not exists registrations_paused boolean not null default false;

drop function if exists public.khet_club_get_season();

create function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text, sowing_date date,
  estimated_harvest date, registration_deadline date, total_plots integer,
  contact_email text, contact_phone text, fff_collected_inr integer,
  warehouse_capacity_tonnes integer, season_label text,
  registrations_paused boolean
)
language sql
stable security definer
set search_path to 'public'
as $function$
  select current_stage, progress, health, sowing_date, estimated_harvest, registration_deadline,
         total_plots, contact_email, contact_phone, fff_collected_inr, warehouse_capacity_tonnes,
         season_label, registrations_paused
  from public.khet_club_season where id = 1;
$function$;

-- khet_club_claim_my_plan was also updated to check registrations_paused
-- before anything else that could succeed. See the applied migration
-- for the full function body.
