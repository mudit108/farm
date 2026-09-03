-- Make the total plot count admin-configurable instead of hardcoded at
-- 80 everywhere. total_plots lives on khet_club_season (already the
-- farm-wide settings table). The old CHECK constraint enforced an upper
-- bound of 80 at the table level — that has to go, since the bound is
-- now "however many rows currently exist," not a fixed number.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_season
  add column if not exists total_plots int not null default 80 check (total_plots > 0);

update public.khet_club_season set total_plots = 80 where id = 1;

alter table public.khet_club_plots
  drop constraint khet_club_plots_plot_number_check;
alter table public.khet_club_plots
  add constraint khet_club_plots_plot_number_check check (plot_number > 0);

drop function if exists public.khet_club_get_season();

create function public.khet_club_get_season()
returns table(
  current_stage text, progress smallint, health text,
  sowing_date date, estimated_harvest date, registration_deadline date,
  total_plots int
)
language sql
security definer
stable
set search_path = public
as $$
  select current_stage, progress, health, sowing_date, estimated_harvest, registration_deadline, total_plots
  from public.khet_club_season where id = 1;
$$;

revoke all on function public.khet_club_get_season() from public;
grant execute on function public.khet_club_get_season() to anon, authenticated;

create or replace function public.khet_club_claim_my_plan(p_plan_id text, p_start_plot int default null)
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
  v_end_plot int;
  v_batch_id uuid := gen_random_uuid();
  v_assigned int[];
  v_deadline date;
  v_total_plots int;
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

  select registration_deadline, total_plots into v_deadline, v_total_plots
  from public.khet_club_season where id = 1;

  if v_deadline is not null and current_date > v_deadline then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
  into v_email, v_full_name, v_phone
  from auth.users where id = v_user_id;

  if p_start_plot is not null then
    v_end_plot := p_start_plot + v_plot_count - 1;
    if p_start_plot < 1 or v_end_plot > v_total_plots then
      raise exception 'INVALID_RANGE';
    end if;

    select array_agg(plot_number order by plot_number) into v_assigned
    from (
      select plot_number
      from public.khet_club_plots
      where plot_number between p_start_plot and v_end_plot
        and status = 'available'
      order by plot_number
      for update skip locked
    ) sub;

    if v_assigned is null or array_length(v_assigned, 1) < v_plot_count then
      raise exception 'PLOTS_NOT_AVAILABLE';
    end if;
  else
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
  end if;

  update public.khet_club_plots
  set status = 'filled',
      user_id = v_user_id,
      full_name = coalesce(v_full_name, 'Mera Khet Member'),
      phone = v_phone,
      email = v_email,
      plan_id = p_plan_id,
      claim_batch_id = v_batch_id,
      assigned_at = now()
  where plot_number = any(v_assigned);

  return v_assigned;
end;
$$;

revoke all on function public.khet_club_claim_my_plan(text, int) from public;
revoke execute on function public.khet_club_claim_my_plan(text, int) from anon;
grant execute on function public.khet_club_claim_my_plan(text, int) to authenticated;

create or replace function public.khet_club_claim_my_plan_as(p_user_id uuid, p_plan_id text, p_start_plot int default null)
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
  v_end_plot int;
  v_batch_id uuid := gen_random_uuid();
  v_assigned int[];
  v_deadline date;
  v_total_plots int;
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

  select registration_deadline, total_plots into v_deadline, v_total_plots
  from public.khet_club_season where id = 1;

  if v_deadline is not null and current_date > v_deadline then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
  into v_email, v_full_name, v_phone
  from auth.users where id = p_user_id;

  if p_start_plot is not null then
    v_end_plot := p_start_plot + v_plot_count - 1;
    if p_start_plot < 1 or v_end_plot > v_total_plots then
      raise exception 'INVALID_RANGE';
    end if;

    select array_agg(plot_number order by plot_number) into v_assigned
    from (
      select plot_number
      from public.khet_club_plots
      where plot_number between p_start_plot and v_end_plot
        and status = 'available'
      order by plot_number
      for update skip locked
    ) sub;

    if v_assigned is null or array_length(v_assigned, 1) < v_plot_count then
      raise exception 'PLOTS_NOT_AVAILABLE';
    end if;
  else
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
  end if;

  update public.khet_club_plots
  set status = 'filled',
      user_id = p_user_id,
      full_name = coalesce(v_full_name, 'Mera Khet Member'),
      phone = v_phone,
      email = v_email,
      plan_id = p_plan_id,
      claim_batch_id = v_batch_id,
      assigned_at = now()
  where plot_number = any(v_assigned);

  return v_assigned;
end;
$$;

revoke all on function public.khet_club_claim_my_plan_as(uuid, text, int) from public;
revoke execute on function public.khet_club_claim_my_plan_as(uuid, text, int) from anon, authenticated;
grant execute on function public.khet_club_claim_my_plan_as(uuid, text, int) to service_role;

create or replace function public.khet_club_resize_farm(p_new_total int)
returns table(previous_total int, new_total int, plots_added int, plots_removed int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_total int;
  v_filled_above int;
  v_added int := 0;
  v_removed int := 0;
begin
  if p_new_total is null or p_new_total <= 0 then
    raise exception 'INVALID_TOTAL';
  end if;

  select total_plots into v_current_total from public.khet_club_season where id = 1;

  if p_new_total > v_current_total then
    insert into public.khet_club_plots (plot_number, status)
    select gs, 'available'
    from generate_series(v_current_total + 1, p_new_total) as gs;
    v_added := p_new_total - v_current_total;

  elsif p_new_total < v_current_total then
    select count(*) into v_filled_above
    from public.khet_club_plots
    where plot_number > p_new_total and status = 'filled';

    if v_filled_above > 0 then
      raise exception 'PLOTS_ALREADY_CLAIMED: % plot(s) above #% are already claimed', v_filled_above, p_new_total;
    end if;

    delete from public.khet_club_plots where plot_number > p_new_total;
    v_removed := v_current_total - p_new_total;
  end if;

  update public.khet_club_season set total_plots = p_new_total where id = 1;

  return query select v_current_total, p_new_total, v_added, v_removed;
end;
$$;

revoke all on function public.khet_club_resize_farm(int) from public;
revoke execute on function public.khet_club_resize_farm(int) from anon, authenticated;
grant execute on function public.khet_club_resize_farm(int) to service_role;
