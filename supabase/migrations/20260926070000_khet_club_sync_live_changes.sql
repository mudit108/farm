-- Brings the repo in line with changes applied live to project
-- aoorwbjnskretualzzhi ("merakhet") on 2026-09-25/26. Every statement is
-- idempotent (add column if not exists / create or replace), so running
-- this against the live database is a no-op; running it on a fresh
-- database rebuilt from this folder produces the same schema.
--
-- Live migration names covered: add_plan_offer_fields,
-- add_member_address_fields, claim_my_plan_capture_address,
-- claim_my_plan_as_capture_address, plot_clear_log_address,
-- certificate_season_label, season_scoped_money_and_member_archive.
-- Also supersedes 20260909120000_khet_club_claim_captures_city.sql, which
-- was committed as a comment header only.

-- Plan price "was ₹X" offer (display-only; price_inr is what's charged).
alter table public.khet_club_plan_prices
  add column if not exists strike_price_inr integer null,
  add column if not exists offer_ends_at date null;

-- Member delivery address.
alter table public.khet_club_plots
  add column if not exists address text,
  add column if not exists pincode text;

alter table public.khet_club_plot_clear_log
  add column if not exists previous_address text,
  add column if not exists previous_pincode text;

-- Certificates remember the season they were issued in, so resends match.
alter table public.khet_club_certificates add column if not exists season_label text;

-- Season-scoped finance: closing a season stamps its payments/expenses.
alter table public.khet_club_payments add column if not exists archived_season_id uuid;
alter table public.khet_club_expenses add column if not exists archived_season_id uuid;

create table if not exists public.khet_club_season_member_archive (
  id uuid primary key default gen_random_uuid(),
  archived_season_id uuid not null references public.khet_club_season_archive(id) on delete cascade,
  plot_number int not null,
  user_id uuid,
  full_name text,
  phone text,
  email text,
  city text,
  address text,
  pincode text,
  plan_id text,
  claim_batch_id uuid,
  assigned_at timestamptz,
  approved_at timestamptz
);
alter table public.khet_club_season_member_archive enable row level security;
revoke all on public.khet_club_season_member_archive from anon, authenticated;
grant all on public.khet_club_season_member_archive to service_role;

-- Claim functions: copy name/phone/city/address/pincode from the member's
-- signup metadata onto the plots they claim.
CREATE OR REPLACE FUNCTION public.khet_club_claim_my_plan(p_plan_id text, p_start_plot integer DEFAULT NULL::integer)
 RETURNS integer[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_phone text;
  v_city text;
  v_address text;
  v_pincode text;
  v_plot_count int;
  v_end_plot int;
  v_batch_id uuid := gen_random_uuid();
  v_assigned int[];
  v_deadline date;
  v_total_plots int;
  v_paused boolean;
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

  select registration_deadline, total_plots, registrations_paused
  into v_deadline, v_total_plots, v_paused
  from public.khet_club_season where id = 1;

  if v_paused then
    raise exception 'REGISTRATIONS_PAUSED';
  end if;

  if v_deadline is not null and current_date > v_deadline then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone',
         raw_user_meta_data->>'city', raw_user_meta_data->>'address', raw_user_meta_data->>'pincode'
  into v_email, v_full_name, v_phone, v_city, v_address, v_pincode
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
      city = v_city,
      address = v_address,
      pincode = v_pincode,
      plan_id = p_plan_id,
      claim_batch_id = v_batch_id,
      assigned_at = now()
  where plot_number = any(v_assigned);

  return v_assigned;
end;
$function$;

CREATE OR REPLACE FUNCTION public.khet_club_claim_my_plan_as(p_user_id uuid, p_plan_id text, p_start_plot integer DEFAULT NULL::integer)
 RETURNS integer[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_email text;
  v_full_name text;
  v_phone text;
  v_city text;
  v_address text;
  v_pincode text;
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

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone',
         raw_user_meta_data->>'city', raw_user_meta_data->>'address', raw_user_meta_data->>'pincode'
  into v_email, v_full_name, v_phone, v_city, v_address, v_pincode
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
      city = v_city,
      address = v_address,
      pincode = v_pincode,
      plan_id = p_plan_id,
      claim_batch_id = v_batch_id,
      assigned_at = now()
  where plot_number = any(v_assigned);

  return v_assigned;
end;
$function$;

-- Season close: season-scoped revenue, stamps payments/expenses, snapshots
-- the member list, and clears address/pincode/approval with the plots.
CREATE OR REPLACE FUNCTION public.khet_club_close_season(p_confirm_label text, p_new_season_label text, p_new_crop text DEFAULT 'Gehu (Wheat)'::text, p_closed_by uuid DEFAULT NULL::uuid)
 RETURNS TABLE(archive_id uuid, plots_freed integer, members_archived integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_season record;
  v_archive_id uuid;
  v_filled int;
  v_members int;
  v_revenue int;
  v_freed int;
begin
  select * into v_season from public.khet_club_season where id = 1;
  if not found then
    raise exception 'No current season row found';
  end if;

  if p_confirm_label is distinct from v_season.season_label then
    raise exception 'Confirmation label does not match the current season (%). Rollover aborted.', v_season.season_label;
  end if;

  if coalesce(trim(p_new_season_label), '') = '' then
    raise exception 'A new season label is required';
  end if;

  select count(*) into v_filled from public.khet_club_plots where status = 'filled';
  select count(distinct user_id) into v_members from public.khet_club_plots where status = 'filled' and user_id is not null;
  select coalesce(sum(amount), 0) / 100 into v_revenue
    from public.khet_club_payments where status = 'paid' and archived_season_id is null;

  insert into public.khet_club_season_archive (
    season_label, crop_name, sowing_date, harvest_date, total_plots,
    plots_filled, members_count, revenue_inr, fff_collected_inr, closed_by
  ) values (
    v_season.season_label, 'Gehu (Wheat)', v_season.sowing_date, v_season.estimated_harvest,
    v_season.total_plots, v_filled, v_members, v_revenue, v_season.fff_collected_inr, p_closed_by
  ) returning id into v_archive_id;

  update public.khet_club_certificates set archived_season_id = v_archive_id where archived_season_id is null;
  update public.khet_club_payments set archived_season_id = v_archive_id where archived_season_id is null;
  update public.khet_club_expenses set archived_season_id = v_archive_id where archived_season_id is null;

  insert into public.khet_club_season_member_archive (
    archived_season_id, plot_number, user_id, full_name, phone, email, city, address, pincode,
    plan_id, claim_batch_id, assigned_at, approved_at
  )
  select v_archive_id, plot_number, user_id, full_name, phone, email, city, address, pincode,
         plan_id, claim_batch_id, assigned_at, approved_at
  from public.khet_club_plots where status = 'filled';

  update public.khet_club_plots
    set archived_season_id = v_archive_id
    where status = 'filled' and archived_season_id is null;

  update public.khet_club_plots
    set status = 'available',
        user_id = null,
        full_name = null,
        phone = null,
        email = null,
        city = null,
        address = null,
        pincode = null,
        plan_id = null,
        claim_batch_id = null,
        assigned_at = null,
        approved_at = null,
        approved_by = null,
        custom_name = null
    where status = 'filled';
  get diagnostics v_freed = row_count;

  update public.khet_club_season
    set season_label = p_new_season_label,
        current_stage = 'Field Preparation',
        progress = 0,
        health = 'Preparing for Season',
        sowing_date = null,
        estimated_harvest = null,
        registration_deadline = null,
        fff_collected_inr = 0,
        updated_at = now()
    where id = 1;

  return query select v_archive_id, v_freed, v_members;
end;
$function$;
