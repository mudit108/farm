-- Payment tracking for Razorpay-backed plan purchases. A plan is only
-- claimed (khet_club_claim_my_plan) after payment is verified server-side
-- — see app/actions/payment.ts. This table is the source of truth for
-- what was paid, by whom, and whether it resulted in a plot assignment.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('1-plot', '3-plots', '6-plots')),
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount int not null, -- paise
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'refunded')),
  claim_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.khet_club_payments enable row level security;

create policy "users read own payments" on public.khet_club_payments
  for select to authenticated using (user_id = auth.uid());
grant select on public.khet_club_payments to authenticated;
grant all on public.khet_club_payments to service_role;

create or replace function public.khet_club_set_payment_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger khet_club_payments_updated_at
  before update on public.khet_club_payments
  for each row execute function public.khet_club_set_payment_updated_at();
