-- Plan prices become admin-editable instead of hardcoded in lib/demo-data.ts.
-- Seeded with the current real prices so nothing changes until an admin
-- explicitly edits them. The payment flow reads this table directly at
-- checkout time — not the static file — so a price change actually
-- affects what's charged, not just what's displayed.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_plan_prices (
  plan_id text primary key check (plan_id in ('1-plot', '3-plots', '6-plots')),
  price_inr int not null check (price_inr > 0),
  updated_at timestamptz not null default now()
);

insert into public.khet_club_plan_prices (plan_id, price_inr) values
  ('1-plot', 20000),
  ('3-plots', 50000),
  ('6-plots', 100000);

alter table public.khet_club_plan_prices enable row level security;

create policy "anyone can read plan prices" on public.khet_club_plan_prices
  for select to anon, authenticated using (true);

-- Read-only for everyone except service_role (admin actions) — verified
-- via live exploit attempt for both anon and authenticated before
-- shipping, given this table controls real money charged at checkout.
revoke all on public.khet_club_plan_prices from anon, authenticated;
grant select on public.khet_club_plan_prices to anon, authenticated;
grant all on public.khet_club_plan_prices to service_role;
