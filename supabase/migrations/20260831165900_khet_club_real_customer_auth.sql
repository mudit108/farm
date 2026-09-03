-- Move plot claiming from an anonymous public form to a real, account-gated
-- flow: sign up -> confirm email -> log in -> claim your plot as yourself.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_plots
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists khet_club_plots_user_id_unique
  on public.khet_club_plots(user_id) where user_id is not null;

-- Replace the old anon-facing view/policy/grants with a tighter model:
--   - nobody gets row-level table access except a signed-in user reading
--     their OWN row (for "my plot" on the dashboard)
--   - the public 80-plot grid is served by a narrow SECURITY DEFINER
--     function that returns only plot_number + status for everyone,
--     logged in or not
drop view if exists public.khet_club_plots_public;
drop policy if exists "public can read plot status" on public.khet_club_plots;
revoke select on public.khet_club_plots from anon, authenticated;

create policy "users can read own plot"
  on public.khet_club_plots
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.khet_club_plots to authenticated;

create or replace function public.khet_club_all_plot_statuses()
returns table(plot_number int, status text)
language sql
security definer
stable
set search_path = public
as $$
  select plot_number, status from public.khet_club_plots order by plot_number;
$$;

revoke all on function public.khet_club_all_plot_statuses() from public;
grant execute on function public.khet_club_all_plot_statuses() to anon, authenticated;

-- Claim a plot AS the currently authenticated user. Name/phone come from
-- their verified signup metadata (not client input, so they can't be
-- spoofed); only city is asked for at claim time.
create or replace function public.khet_club_claim_my_plot(p_city text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_phone text;
  v_plot_number int;
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'phone'
  into v_email, v_full_name, v_phone
  from auth.users where id = v_user_id;

  if exists (select 1 from public.khet_club_plots where user_id = v_user_id) then
    raise exception 'ALREADY_HAS_PLOT';
  end if;

  select plot_number into v_plot_number
  from public.khet_club_plots
  where status = 'available'
  order by plot_number
  for update skip locked
  limit 1;

  if v_plot_number is null then
    raise exception 'NO_PLOTS_AVAILABLE';
  end if;

  update public.khet_club_plots
  set status = 'filled',
      user_id = v_user_id,
      full_name = coalesce(v_full_name, 'Khet Club Member'),
      phone = v_phone,
      email = v_email,
      city = p_city,
      assigned_at = now()
  where plot_number = v_plot_number;

  return v_plot_number;
end;
$$;

revoke all on function public.khet_club_claim_my_plot(text) from public;
grant execute on function public.khet_club_claim_my_plot(text) to authenticated;

-- The old anonymous claim RPC (khet_club_claim_next_plot) is left in place
-- but unused by the app now — still locked to service_role only.
