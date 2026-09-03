-- CRITICAL FIX. Supabase grants broad INSERT/UPDATE/SELECT column
-- privileges to anon and authenticated by default on every new table in
-- the public schema — the same auto-grant behavior already discovered
-- and fixed for FUNCTIONS early in this project (see migration 4), which
-- was not also checked for TABLES until it was caught live via direct
-- testing: a plot owner was able to set status='available' on their own
-- row through the nickname UPDATE policy added in the previous
-- migration, because the underlying grant covered every column, not
-- just custom_name.
--
-- This had been harmless everywhere RLS had NO policy for a given
-- operation (default-deny regardless of the grant), which is why it went
-- unnoticed until a table got its first INSERT/UPDATE policy. This
-- migration revokes the blanket grants everywhere and replaces them with
-- precise, minimal grants matching each table's actual intended access.
--
-- Applied to project aoorwbjnskretualzzhi ("merakhet"), immediately
-- after discovering the issue via direct exploit testing. Verified fixed
-- by re-running the same exploit attempt (correctly rejected afterward).
--
-- LESSON: the Supabase security advisor (get_advisors) does NOT catch
-- this class of issue — it only flags RLS-policy-less tables and
-- SECURITY DEFINER functions, not excess table/column grants. Any new
-- INSERT or UPDATE policy on any table should be paired with an explicit
-- audit of information_schema.column_privileges for that table before
-- being considered safe, not just a passing advisor check.

-- --- khet_club_plots: the table that actually got exploited in testing ---
revoke all on public.khet_club_plots from anon, authenticated;
grant select on public.khet_club_plots to authenticated;
grant update (custom_name) on public.khet_club_plots to authenticated;

-- --- khet_club_farm_visits: INSERT policy existed but covered all columns,
-- letting a customer set their own request's status (e.g. pre-approve
-- themselves) at insert time ------------------------------------------
revoke all on public.khet_club_farm_visits from anon, authenticated;
grant select on public.khet_club_farm_visits to authenticated;
grant insert (user_id, preferred_date, visitors, phone, notes) on public.khet_club_farm_visits to authenticated;

-- --- khet_club_support_messages: same pattern, could self-set status ---
revoke all on public.khet_club_support_messages from anon, authenticated;
grant select on public.khet_club_support_messages to authenticated;
grant insert (user_id, subject, message) on public.khet_club_support_messages to authenticated;

-- --- khet_club_harvest_preferences: every column here is legitimately
-- user-controlled already, but scope precisely anyway (exclude
-- reassigning user_id on UPDATE; updated_at is trigger-controlled) ------
revoke all on public.khet_club_harvest_preferences from anon, authenticated;
grant select on public.khet_club_harvest_preferences to authenticated;
grant insert (user_id, method, schedule, installment_kg) on public.khet_club_harvest_preferences to authenticated;
grant update (method, schedule, installment_kg) on public.khet_club_harvest_preferences to authenticated;

-- --- Tables with only a SELECT policy for authenticated (no INSERT/UPDATE
-- policy exists, so the excess grant was never actually exploitable —
-- tightened anyway so a future policy addition doesn't silently inherit
-- broad access the way khet_club_plots just did) ------------------------
revoke all on public.khet_club_documents from anon, authenticated;
grant select on public.khet_club_documents to authenticated;

revoke all on public.khet_club_updates from anon, authenticated;
grant select on public.khet_club_updates to anon, authenticated;

revoke all on public.khet_club_payments from anon, authenticated;
grant select on public.khet_club_payments to authenticated;

-- --- Tables with NO policies for anon/authenticated at all (locked;
-- accessed only via SECURITY DEFINER functions or service_role) --------
revoke all on public.khet_club_season from anon, authenticated;
revoke all on public.khet_club_cameras from anon, authenticated;
revoke all on public.khet_club_whatsapp_messages from anon, authenticated;
