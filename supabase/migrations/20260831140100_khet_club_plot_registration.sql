-- Khet Club: plot registration system (80 plots)
-- Table is prefixed khet_club_* to avoid colliding with other apps that may
-- share this Supabase project.
-- Applied to project aoorwbjnskretualzzhi ("merakhet") on 2026-08-31.

create table if not exists public.khet_club_plots (
  plot_number int primary key check (plot_number between 1 and 80),
  status text not null default 'available' check (status in ('available', 'filled')),
  full_name text,
  phone text,
  email text,
  city text,
  assigned_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.khet_club_plots enable row level security;
grant all on public.khet_club_plots to service_role;

create or replace function public.khet_club_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists khet_club_plots_updated_at on public.khet_club_plots;
create trigger khet_club_plots_updated_at
  before update on public.khet_club_plots
  for each row execute function public.khet_club_set_updated_at();

-- Atomic "claim the next available plot" — prevents two simultaneous signups
-- from getting the same plot number (row-level lock + SKIP LOCKED).
-- SECURITY DEFINER + granted to service_role only: callable exclusively from
-- server-side code holding the service role key, never from the browser.
create or replace function public.khet_club_claim_next_plot(
  p_full_name text,
  p_phone text,
  p_email text,
  p_city text
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plot_number int;
begin
  if p_email is not null and exists (
    select 1 from public.khet_club_plots
    where email = p_email and status = 'filled'
  ) then
    raise exception 'EMAIL_ALREADY_REGISTERED';
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
      full_name = p_full_name,
      phone = p_phone,
      email = p_email,
      city = p_city,
      assigned_at = now()
  where plot_number = v_plot_number;

  return v_plot_number;
end;
$$;

revoke all on function public.khet_club_claim_next_plot(text, text, text, text) from public;
grant execute on function public.khet_club_claim_next_plot(text, text, text, text) to service_role;

-- Seed 80 plots: 1-30 already filled (offline/legacy reservations, no PII on
-- file), 31-80 available for online signup.
insert into public.khet_club_plots (plot_number, status, full_name, assigned_at)
select
  gs,
  case when gs <= 30 then 'filled' else 'available' end,
  case when gs <= 30 then 'Reserved (offline)' else null end,
  case when gs <= 30 then now() else null end
from generate_series(1, 80) as gs
on conflict (plot_number) do nothing;
