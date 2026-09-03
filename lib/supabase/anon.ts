import { createClient } from "@supabase/supabase-js";

/**
 * Anon-key client — safe to use from Server Components for public reads.
 * RLS on public.khet_club_plots only grants this role the plot_number and
 * status columns (see supabase/migrations); it can never see PII.
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
