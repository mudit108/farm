-- Season budget allocation. Percentages apply to ALLOCATABLE revenue:
--   allocatable = paid revenue - Feeding Families Fund earmarked
-- The nine categories sum to exactly 100% with no FFF line, but FFF is
-- ₹1,000/plot already committed out of every membership. Allocating
-- against gross revenue would silently over-commit by that amount and
-- double-spend money already promised to wheat donations.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").
create table public.khet_club_budget (
  category text primary key,
  label text not null,
  percent numeric(5,2) not null check (percent >= 0 and percent <= 100),
  manual_amount_inr integer check (manual_amount_inr is null or manual_amount_inr >= 0),
  sort_order integer not null,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.khet_club_budget enable row level security;
revoke all on public.khet_club_budget from anon, authenticated;
grant all on public.khet_club_budget to service_role;
-- Seed rows: see the applied migration for the nine category inserts.
