-- Showing the discounted total before checkout means the validator can
-- now be called repeatedly without committing to a payment — which
-- makes it a brute-force oracle for guessing codes. This logs attempts
-- so failures can be rate-limited per user (10 failures / 60 minutes,
-- enforced in previewDiscountCode).
--
-- Only FAILED attempts count toward the limit: someone legitimately
-- re-checking a code they hold should never be locked out. Verified
-- live — 10 failures counted, a successful attempt alongside them did
-- not.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_discount_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_code text not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

alter table public.khet_club_discount_attempts enable row level security;

revoke all on public.khet_club_discount_attempts from anon, authenticated;
grant all on public.khet_club_discount_attempts to service_role;

create index khet_club_discount_attempts_user_idx
  on public.khet_club_discount_attempts (user_id, attempted_at desc)
  where succeeded = false;
