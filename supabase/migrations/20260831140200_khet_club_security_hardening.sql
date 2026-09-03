-- Security hardening, applied right after the initial migration in response
-- to Supabase's security advisor (get_advisors) flagging:
--  1. khet_club_plots_public defaulted to SECURITY DEFINER view semantics.
--  2. khet_club_claim_next_plot was technically executable by anon/authenticated
--     despite the "revoke ... from public" in migration 1 (belt-and-suspenders fix).
--  3. khet_club_set_updated_at had a mutable search_path.

-- Fix 1: the public view must run with the QUERYING role's privileges
-- (security_invoker), not the view owner's. To let anon still read just
-- plot_number/status, grant SELECT on exactly those two columns plus a
-- permissive row policy — PII columns stay ungrantable to anon/authenticated.
drop view if exists public.khet_club_plots_public;

create policy "public can read plot status"
  on public.khet_club_plots
  for select
  to anon, authenticated
  using (true);

grant select (plot_number, status) on public.khet_club_plots to anon, authenticated;

create view public.khet_club_plots_public
  with (security_invoker = true) as
  select plot_number, status
  from public.khet_club_plots
  order by plot_number;

grant select on public.khet_club_plots_public to anon, authenticated;

-- Fix 2: pin search_path on the trigger function too.
create or replace function public.khet_club_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix 3: explicit revoke for anon/authenticated on the plot-assignment RPC.
revoke execute on function public.khet_club_claim_next_plot(text, text, text, text) from anon, authenticated;
