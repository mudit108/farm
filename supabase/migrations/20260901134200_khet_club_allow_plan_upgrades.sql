-- Relax the claim functions: a customer may now buy more than one plan
-- (upgrade/stack additional plots) as long as today is on/before
-- registration_deadline (or no deadline is set). Previously any existing
-- plot blocked a second claim entirely.
-- Applied to project aoorwbjnskretualzzhi ("merakhet"). Run migration
-- 9 (add_registration_deadline_column) before this one.

drop function if exists public.khet_club_get_season();

create function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text,
  sowing_date date, estimated_harvest date, registration_deadline date
)
language sql
security definer
stable
set search_path = public
as $$
  select current_stage, progress, health, sowing_date, estimated_harvest, registration_deadline
  from public.khet_club_season where id = 1;
$$;

revoke all on function public.khet_club_get_season() from public;
grant execute on function public.khet_club_get_season() to anon, authenticated;

create or replace function public.khet_club_claim_my_plan(p_plan_id text)
returns int[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_phone text;
  v_plot_count int;
  v_batch_id uuid := gen_random_uuid();
  v_assigned int[];
  v_deadline date;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  v_plot_count := case p_plan_id
    when '1-plot' then 1
    when '3-plots' then 3
    when '6-plots' then 6
    else null
  end;
  if v_plot_count is null then
    raise exception 'INVALID_PLAN';
  end if;

  select registration_deadline into v_deadline from public.khet_club_season where id = 1;
  if v_deadline is not null and current_date > v_deadline then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
  into v_email, v_full_name, v_phone
  from auth.users where id = v_user_id;

  select array_agg(plot_number order by plot_number) into v_assigned
  from (
    select plot_number
    from public.khet_club_plots
    where status = 'available'
    order by plot_number
    for update skip locked
    limit v_plot_count
  ) sub;

  if v_assigned is null or array_length(v_assigned, 1) < v_plot_count then
    raise exception 'NOT_ENOUGH_PLOTS_AVAILABLE';
  end if;

  update public.khet_club_plots
  set status = 'filled',
      user_id = v_user_id,
      full_name = coalesce(v_full_name, 'Khet Club Member'),
      phone = v_phone,
      email = v_email,
      plan_id = p_plan_id,
      claim_batch_id = v_batch_id,
      assigned_at = now()
  where plot_number = any(v_assigned);

  return v_assigned;
end;
$$;

create or replace function public.khet_club_claim_my_plan_as(p_user_id uuid, p_plan_id text)
returns int[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_full_name text;
  v_phone text;
  v_plot_count int;
  v_batch_id uuid := gen_random_uuid();
  v_assigned int[];
  v_deadline date;
begin
  v_plot_count := case p_plan_id
    when '1-plot' then 1
    when '3-plots' then 3
    when '6-plots' then 6
    else null
  end;
  if v_plot_count is null then
    raise exception 'INVALID_PLAN';
  end if;

  select registration_deadline into v_deadline from public.khet_club_season where id = 1;
  if v_deadline is not null and current_date > v_deadline then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
  into v_email, v_full_name, v_phone
  from auth.users where id = p_user_id;

  select array_agg(plot_number order by plot_number) into v_assigned
  from (
    select plot_number
    from public.khet_club_plots
    where status = 'available'
    order by plot_number
    for update skip locked
    limit v_plot_count
  ) sub;

  if v_assigned is null or array_length(v_assigned, 1) < v_plot_count then
    raise exception 'NOT_ENOUGH_PLOTS_AVAILABLE';
  end if;

  update public.khet_club_plots
  set status = 'filled',
      user_id = p_user_id,
      full_name = coalesce(v_full_name, 'Khet Club Member'),
      phone = v_phone,
      email = v_email,
      plan_id = p_plan_id,
      claim_batch_id = v_batch_id,
      assigned_at = now()
  where plot_number = any(v_assigned);

  return v_assigned;
end;
$$;
