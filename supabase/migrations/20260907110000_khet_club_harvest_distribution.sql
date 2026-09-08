-- Harvest distribution model: the farm's total harvest is pooled and
-- divided by the total number of plots, so every member receives an
-- equal per-plot share rather than the literal output of their own
-- specific plots. This protects an individual member from their
-- particular plots underperforming, but ties their share to overall
-- farm performance.
--
-- Admin-configurable because the model itself (pooled vs per-plot) and
-- any deduction percentage are real business decisions that could
-- change between seasons — and the Terms of Service and Membership
-- Agreement describe them, so hardcoding would risk the legal text
-- describing something that is no longer true.
-- Applied to project aoorwbjnskretualzzhi ("merakhet").

alter table public.khet_club_season
  add column if not exists harvest_distribution_model text not null default 'pooled'
    check (harvest_distribution_model in ('pooled', 'per_plot')),
  add column if not exists harvest_deduction_percent numeric(5,2) not null default 0
    check (harvest_deduction_percent >= 0 and harvest_deduction_percent <= 100);
