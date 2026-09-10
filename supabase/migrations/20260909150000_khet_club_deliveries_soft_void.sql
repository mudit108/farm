-- A delivery row records that a member physically received wheat.
-- Deleting one was previously a single unconfirmed click that left no
-- trace: the member's delivered total silently changed and the only
-- evidence of the handover was gone. If a member later disputed the
-- quantity, there was nothing to check against.
--
-- Voided rather than deleted. Unlike a plot (whose row must be
-- recycled back to 'available' and reassigned, which is why that case
-- needed a separate archive table), a delivery row never needs reuse —
-- it only needs to stop counting. Keeping the row means the ID stays
-- stable, the full handover history stays queryable in one place, and
-- restoring a mistake is a single UPDATE.
--
-- IMPORTANT: every query that sums or lists deliveries must filter
-- `voided_at is null`, or voided rows keep counting. Verified live:
-- an unfiltered sum returned 80kg where the correct figure was 50kg.
-- The three read sites are:
--   app/actions/admin-harvest.ts  (WhatsApp progress total)
--   app/admin/members/page.tsx    (admin list — intentionally SHOWS
--                                  voided rows so they can be restored,
--                                  but excludes them from the sum)
--   app/dashboard/my-farm/page.tsx (member's own view — excludes)
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_harvest_deliveries
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users(id),
  add column if not exists void_reason text;

create index if not exists khet_club_harvest_deliveries_active_idx
  on public.khet_club_harvest_deliveries (user_id)
  where voided_at is null;
