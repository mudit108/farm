import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. NEVER import this from a Client Component or expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser — the `server-only` import above
 * makes any accidental client-side import fail the build.
 *
 * Used for:
 *  - calling khet_club_claim_next_plot (plot signup — atomic assignment)
 *  - the admin panel's full read/write access to public.khet_club_plots
 *    (including PII columns the anon role cannot see)
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
