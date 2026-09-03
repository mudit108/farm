-- Supabase auto-grants EXECUTE to anon/authenticated on new public-schema
-- functions via default privileges, separate from "revoke ... from public"
-- in the previous migration. khet_club_claim_my_plot must only ever be
-- callable by a signed-in user — confirmed via get_advisors and fixed here.
revoke execute on function public.khet_club_claim_my_plot(text) from anon;
