-- Let a member choose WHERE their plots start (instead of always getting
-- the next available), as long as the resulting block is a contiguous,
-- available sequential range matching their plan's plot count. Also adds
-- an optional custom nickname members can put on their own plot(s).
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

-- --- Custom nickname -------------------------------------------------
alter table public.khet_club_plots add column if not exists custom_name text;

create policy "users update own plot nickname"
  on public.khet_club_plots
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- NOTE: the column-scoped grant below is intentionally superseded by the
-- hardening migration that follows this one (20260902173500) — Supabase
-- auto-grants broad table privileges by default (see that migration's
-- comment), so this alone was NOT sufficient on its own and was proven
-- exploitable in testing. Both migrations must be applied, in order.
grant update (custom_name) on public.khet_club_plots to authenticated;

-- --- Track the requested starting plot on each payment ----------------
alter table public.khet_club_payments add column if not exists start_plot int;

-- --- Claim function: now supports an optional starting plot -----------
-- Existing calls with just p_plan_id are unaffected (p_start_plot
-- defaults to null = auto-assign, identical to the old behavior).
drop function if exists public.khet_club_claim_my_plan(text);

create function public.khet_club_claim_my_plan(p_plan_id text, p_start_plot int default null)
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

  if p_start_plot is not null then
    v_end_plot := p_start_plot + v_plot_count - 1;
    if p_start_plot < 1 or v_end_plot > 80 then
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

-- --- Service-role variant (webhook): same optional start_plot ---------
drop function if exists public.khet_club_claim_my_plan_as(uuid, text);

create function public.khet_club_claim_my_plan_as(p_user_id uuid, p_plan_id text, p_start_plot int default null)
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

  if p_start_plot is not null then
    v_end_plot := p_start_plot + v_plot_count - 1;
    if p_start_plot < 1 or v_end_plot > 80 then
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
