-- 50-50 split payment: 50% deposit now (locks the plot exactly like a
-- full payment today), 50% balance due 45 days later. A Rs.300/Rs.500
-- convenience fee is charged on the DEPOSIT only (not split), same
-- pattern as a loan processing fee.
--
-- If the balance isn't paid by the due date, nothing happens
-- automatically -- the plot stays reserved and is followed up on
-- manually, per explicit decision. khet_club_installment_plans exists
-- so "follow up manually" is actually possible: a real place to see
-- who owes what and by when, surfaced oldest-due-first in
-- /admin/income.
--
-- Verified live: RLS confirmed a member sees only their own row, not
-- others'; direct member writes confirmed blocked; a full deposit ->
-- installment-plan flow was simulated and the correct Rs.62,500 /
-- 45-day figures came back through the member's own RLS-scoped read,
-- all inside a rolled-back transaction with production confirmed
-- untouched afterward.
--
-- Also fixed in the SAME change: the Razorpay webhook
-- (app/api/webhooks/razorpay/route.ts) is a safety-net path that
-- duplicates the claim logic for when a browser closes right after
-- payment. It had zero knowledge of installments before this -- a
-- deposit paid that way would have claimed the plot but silently
-- never created a balance-due record. Fixed to create the same
-- installment_plans row the main action path does.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_payments
  add column if not exists payment_kind text not null default 'full'
    check (payment_kind in ('full', 'deposit', 'balance')),
  add column if not exists installment_fee_inr integer not null default 0,
  add column if not exists balance_due_inr integer not null default 0;

create table public.khet_club_installment_plans (
  id uuid primary key default gen_random_uuid(),
  claim_batch_id uuid not null,
  user_id uuid not null references auth.users(id),
  plan_id text not null,
  deposit_paid_inr integer not null,
  installment_fee_inr integer not null,
  balance_due_inr integer not null,
  balance_due_date date not null,
  balance_paid boolean not null default false,
  balance_paid_at timestamptz,
  balance_razorpay_order_id text,
  balance_razorpay_payment_id text,
  created_at timestamptz not null default now()
);

alter table public.khet_club_installment_plans enable row level security;

create policy "users can read own installment plan"
  on public.khet_club_installment_plans
  for select
  using (user_id = auth.uid());

revoke insert, update, delete on public.khet_club_installment_plans from authenticated;
grant select on public.khet_club_installment_plans to authenticated;
revoke all on public.khet_club_installment_plans from anon;
grant all on public.khet_club_installment_plans to service_role;

create index khet_club_installment_plans_unpaid_idx
  on public.khet_club_installment_plans (balance_due_date)
  where balance_paid = false;
