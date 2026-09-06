-- Expenses have no automatic data source (unlike income, which comes
-- from real Razorpay payments) — admin logs these manually. Purely
-- internal financial data: no anon or authenticated access at all,
-- only service_role (admin actions).
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('seed', 'labor', 'irrigation', 'fertilizer', 'equipment', 'transport', 'processing', 'feeding_families', 'other')),
  description text not null,
  amount_inr int not null check (amount_inr > 0),
  expense_date date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.khet_club_expenses enable row level security;

-- No policies at all for anon/authenticated — this table is invisible
-- to every non-admin role by default (RLS with zero policies denies
-- all access), and grants are revoked explicitly below as defense in
-- depth on top of that. Verified via live exploit attempt (both anon
-- select and authenticated insert) before shipping.
revoke all on public.khet_club_expenses from anon, authenticated;
grant all on public.khet_club_expenses to service_role;
