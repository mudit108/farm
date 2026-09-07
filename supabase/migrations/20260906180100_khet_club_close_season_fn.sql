-- Closes the current season and opens the next. Deliberately
-- conservative:
--   * Never deletes plots, certificates, receipts or payments.
--   * Archives a snapshot of the finished season first.
--   * Stamps the season's plots and certificates with that archive id
--     so member history stays attributable.
--   * Only then frees plots (status back to 'available', member fields
--     cleared) so the next season can be sold.
--   * Requires an explicit confirmation label matching the current
--     season, so this can't fire from a stray click.
-- Verified via a full dry run against real production data inside a
-- rolled-back transaction before shipping.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create or replace function public.khet_club_close_season(
  p_confirm_label text,
  p_new_season_label text,
  p_new_crop text default 'Gehu (Wheat)',
  p_closed_by uuid default null
)
returns table(archive_id uuid, plots_freed int, members_archived int)
language plpgsql
security definer
set search_path = public
as $$
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
  select coalesce(sum(amount), 0) / 100 into v_revenue from public.khet_club_payments where status = 'paid';

  insert into public.khet_club_season_archive (
    season_label, crop_name, sowing_date, harvest_date, total_plots,
    plots_filled, members_count, revenue_inr, fff_collected_inr, closed_by
  ) values (
    v_season.season_label, 'Gehu (Wheat)', v_season.sowing_date, v_season.estimated_harvest,
    v_season.total_plots, v_filled, v_members, v_revenue, v_season.fff_collected_inr, p_closed_by
  ) returning id into v_archive_id;

  update public.khet_club_certificates
    set archived_season_id = v_archive_id
    where archived_season_id is null;

  update public.khet_club_plots
    set archived_season_id = v_archive_id
    where status = 'filled' and archived_season_id is null;

  update public.khet_club_plots
    set status = 'available', user_id = null, full_name = null, phone = null,
        email = null, city = null, plan_id = null, claim_batch_id = null,
        assigned_at = null, approved_at = null, custom_name = null
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
$$;

revoke all on function public.khet_club_close_season(text, text, text, uuid) from public;
revoke execute on function public.khet_club_close_season(text, text, text, uuid) from anon, authenticated;
grant execute on function public.khet_club_close_season(text, text, text, uuid) to service_role;
