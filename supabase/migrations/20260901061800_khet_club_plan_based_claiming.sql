-- Bridge the 80-plot pool with the 1/3/6-plot pricing plans: a customer
-- now picks a PLAN (not a single anonymous plot), and gets that many plot
-- numbers assigned together in one atomic transaction.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

-- A user can now legitimately own more than one plot (up to 6), so the
-- old one-plot-per-user unique constraint has to go.
drop index if exists public.khet_club_plots_user_id_unique;

-- Track which plan a plot came from, and group plots claimed together in
-- the same transaction so the UI/admin can show them as one membership
-- rather than N unrelated rows.
alter table public.khet_club_plots
  add column if not exists plan_id text check (plan_id in ('1-plot', '3-plots', '6-plots')),
  add column if not exists claim_batch_id uuid;

create index if not exists khet_club_plots_claim_batch_id_idx
  on public.khet_club_plots(claim_batch_id) where claim_batch_id is not null;

create index if not exists khet_club_plots_user_id_idx
  on public.khet_club_plots(user_id) where user_id is not null;

-- Claim an entire PLAN (1, 3, or 6 plots) as the authenticated user, all
-- in one atomic transaction. Blocks a user who already owns any plot from
-- claiming another plan (no upgrades yet — see app for that note).
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

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
  into v_email, v_full_name, v_phone
  from auth.users where id = v_user_id;

  if exists (select 1 from public.khet_club_plots where user_id = v_user_id) then
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

revoke all on function public.khet_club_claim_my_plan(text) from public;
revoke execute on function public.khet_club_claim_my_plan(text) from anon;
grant execute on function public.khet_club_claim_my_plan(text) to authenticated;

-- khet_club_claim_my_plot(text) (single-plot, city-based) is superseded by
-- the plan-based flow above. Left in place, still authenticated-only, in
-- case you want a lightweight single-plot path again later.
