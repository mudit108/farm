-- Admin approval gate: a plot is paid-for and assigned immediately (as
-- before — that flow is proven and stays untouched), but the official
-- certificate is only issued once an admin explicitly reviews and
-- approves the batch. approved_at/approved_by track this per plot,
-- set together for every plot sharing a claim_batch_id.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_plots
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id);

-- One certificate per claim_batch_id (one purchase = one certificate,
-- even if it covers multiple plots). Snapshots full_name/plan_id/
-- plot_numbers at issuance time — a certificate is a historical record
-- and should keep showing what was actually certified even if the
-- underlying plot rows change later (freed, reassigned, name changed).
create sequence if not exists khet_club_certificate_seq start 1;

create table public.khet_club_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_batch_id uuid not null unique,
  plan_id text not null,
  plot_numbers int[] not null,
  full_name text not null,
  area_sq_ft int not null,
  issued_at timestamptz not null default now(),
  approved_by uuid references auth.users(id),
  email_sent boolean not null default false,
  whatsapp_sent boolean not null default false
);

alter table public.khet_club_certificates enable row level security;

create policy "users read own certificates" on public.khet_club_certificates
  for select to authenticated using (user_id = auth.uid());

-- Minimal grants from the start — no INSERT/UPDATE for authenticated at
-- all; every write goes through service_role in the admin approval
-- action. Verified via live exploit attempt before shipping.
revoke all on public.khet_club_certificates from anon, authenticated;
grant select on public.khet_club_certificates to authenticated;
grant all on public.khet_club_certificates to service_role;
