-- Admin could previously wipe a paying member's plot with a single
-- unconfirmed click ("Free Up"), destroying the allocation with no
-- record of who held it. adminFreeBatch was worse — it cleared an
-- entire membership (up to 6 plots) the same way. Nothing was
-- recoverable and nothing was logged.
--
-- This archives every cleared plot before it's wiped, so an accidental
-- clear can always be traced and restored by hand. Deliberately
-- captures the member identity, not just the plot number.
--
-- Paired with app-side guards: clearing a member-held plot now requires
-- typing the plot number back, and freeing a whole batch requires
-- typing REMOVE. Offline reservations (no linked account) stay
-- one-click, since there's no member to harm. The clear is aborted if
-- archiving fails — clearing without a record is exactly what this
-- prevents.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

create table public.khet_club_plot_clear_log (
  id uuid primary key default gen_random_uuid(),
  plot_number int not null,
  previous_user_id uuid,
  previous_full_name text,
  previous_phone text,
  previous_email text,
  previous_city text,
  previous_plan_id text,
  previous_claim_batch_id uuid,
  previous_assigned_at timestamptz,
  was_member_held boolean not null,
  cleared_at timestamptz not null default now(),
  cleared_by uuid references auth.users(id)
);

alter table public.khet_club_plot_clear_log enable row level security;

-- Internal audit data only — holds member PII, no customer ever reads
-- it. Verified via live exploit attempt before shipping.
revoke all on public.khet_club_plot_clear_log from anon, authenticated;
grant all on public.khet_club_plot_clear_log to service_role;

create index khet_club_plot_clear_log_plot_idx
  on public.khet_club_plot_clear_log (plot_number, cleared_at desc);
