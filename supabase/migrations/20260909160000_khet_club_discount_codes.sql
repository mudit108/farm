-- Discount codes for friends/family and future promotions.
--
-- SECURITY NOTES (all verified by live exploit attempt before shipping):
--  * The codes table is service_role ONLY. A logged-in customer gets
--    "permission denied" on both the table and the validate function,
--    so codes cannot be enumerated or brute-forced directly.
--  * The discounted amount is computed inside khet_club_validate_discount
--    from the live price in khet_club_plan_prices — never from anything
--    the client sends. createPlanOrder passes only the code string.
--  * A code is only counted as USED when a payment actually succeeds
--    (khet_club_redeem_discount, called from verifyPaymentAndClaim), not
--    when a checkout is opened — otherwise abandoned checkouts would
--    silently burn a limited code's remaining uses.
--  * khet_club_redeem_discount is idempotent on razorpay_order_id, so a
--    webhook retry or double verification cannot double-count.
--  * A discount can never take the total to zero or below: it clamps to
--    leave ₹1, since Razorpay cannot process a ₹0 order. A genuinely
--    free plot should be assigned from the admin panel instead.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  max_uses int check (max_uses is null or max_uses > 0),
  times_used int not null default 0,
  expires_at date,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create unique index khet_club_discount_codes_code_upper_idx
  on public.khet_club_discount_codes (upper(code));

create table public.khet_club_discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.khet_club_discount_codes(id),
  user_id uuid not null references auth.users(id),
  razorpay_order_id text not null unique,
  plan_id text not null,
  original_inr int not null,
  discount_inr int not null,
  final_inr int not null,
  redeemed_at timestamptz not null default now()
);

alter table public.khet_club_discount_codes enable row level security;
alter table public.khet_club_discount_redemptions enable row level security;

revoke all on public.khet_club_discount_codes from anon, authenticated;
revoke all on public.khet_club_discount_redemptions from anon, authenticated;
grant all on public.khet_club_discount_codes to service_role;
grant all on public.khet_club_discount_redemptions to service_role;

alter table public.khet_club_payments
  add column if not exists discount_code_id uuid references public.khet_club_discount_codes(id),
  add column if not exists discount_inr int not null default 0;

-- See 20260909160100 for khet_club_validate_discount and
-- khet_club_redeem_discount function bodies.
