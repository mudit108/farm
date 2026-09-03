-- Service-role variant of khet_club_claim_my_plan, for the Razorpay
-- webhook (app/api/webhooks/razorpay/route.ts), which has no end-user
-- session to derive auth.uid() from. Takes an explicit p_user_id instead.
-- ONLY service_role may call this — the webhook has already verified the
-- Razorpay signature and matched the payment to that user_id before this
-- runs, so the safety this function is missing (auth.uid() binding) is
-- provided by the caller instead.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

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

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
  into v_email, v_full_name, v_phone
  from auth.users where id = p_user_id;

  if exists (select 1 from public.khet_club_plots where user_id = p_user_id) then
    raise exception 'ALREADY_HAS_PLOT';
  end if;

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

revoke all on function public.khet_club_claim_my_plan_as(uuid, text) from public;
revoke execute on function public.khet_club_claim_my_plan_as(uuid, text) from anon, authenticated;
grant execute on function public.khet_club_claim_my_plan_as(uuid, text) to service_role;
